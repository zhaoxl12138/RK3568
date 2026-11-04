/*
 * Day 4：把 Day3 已映射的 MMAP Buffer 交给驱动，启动 Camera 管线，
 *        连续取回 10 个完成 Buffer，并在处理后重新放回队列。
 *
 * 完整控制顺序：
 *   open
 *     -> VIDIOC_S_FMT
 *     -> VIDIOC_REQBUFS
 *     -> VIDIOC_QUERYBUF + mmap
 *     -> VIDIOC_QBUF（把所有空 Buffer 交给驱动）
 *     -> VIDIOC_STREAMON
 *     -> poll + VIDIOC_DQBUF（取得一帧）
 *     -> VIDIOC_QBUF（处理后归还，重复 10 次）
 *     -> VIDIOC_STREAMOFF
 *     -> munmap
 *     -> VIDIOC_REQBUFS(count=0)
 *     -> close
 *
 * 本程序只打印帧元数据，不保存 NV12 文件。保存和验证图像属于 Day5。
 */

/* errno / EINTR / EAGAIN：判断系统调用失败原因。 */
#include <errno.h>
/* open()、O_RDWR、O_NONBLOCK。 */
#include <fcntl.h>
/* V4L2 用户态结构体、Buffer 状态和 VIDIOC_* 命令。 */
#include <linux/videodev2.h>
/* poll()：等待 Video Node 出现可 DQBUF 的完成 Buffer。 */
#include <poll.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
/* mmap()、munmap()。 */
#include <sys/mman.h>
#include <unistd.h>

#define REQUEST_WIDTH 3840U
#define REQUEST_HEIGHT 2160U
#define REQUEST_BUFFER_COUNT 4U
#define CAPTURE_FRAME_COUNT 10U
#define FRAME_TIMEOUT_MS 2000

/*
 * 应用自己的映射登记表：记录每个驱动 Buffer 的各 Plane 在用户空间中的
 * 虚拟地址和长度。它不是内核 VB2 Buffer，也不表示 Buffer 当前处于
 * DEQUEUED、QUEUED、ACTIVE 还是 DONE 状态。
 */
struct mapped_buffer {
    unsigned int num_planes;
    void *start[VIDEO_MAX_PLANES];
    size_t length[VIDEO_MAX_PLANES];
};

static int xioctl(int fd, unsigned long request, void *arg)
{
    int ret;

    /*
     * fd 决定操作哪个 /dev/videoX，request 决定执行哪个 V4L2 命令，
     * arg 指向应用和驱动双向交换数据的 UAPI 结构体。
     */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static void set_format(int fd)
{
    struct v4l2_format fmt;

    memset(&fmt, 0, sizeof(fmt));

    /* 这些字段是应用的请求值；S_FMT 返回后要以驱动回填值为准。 */
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    fmt.fmt.pix_mp.width = REQUEST_WIDTH;
    fmt.fmt.pix_mp.height = REQUEST_HEIGHT;
    fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
    fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

    if (xioctl(fd, VIDIOC_S_FMT, &fmt) == -1) {
        perror("VIDIOC_S_FMT");
        exit(EXIT_FAILURE);
    }

    /*
     * num_planes 表示这个 MPlane Buffer 实际包含几个独立内存 Plane。
     * 本板 NV12 通常返回 1，不能因为 NV12 有 Y/UV 两个内容区域就写死为 2。
     */
    printf("format           : NV12 %ux%u, planes=%u\n",
           fmt.fmt.pix_mp.width,
           fmt.fmt.pix_mp.height,
           fmt.fmt.pix_mp.num_planes);

}

static unsigned int request_buffers(int fd)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    req.count = REQUEST_BUFFER_COUNT;
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    req.memory = V4L2_MEMORY_MMAP;

    /*
     * REQBUFS 请求 VB2/驱动建立 Buffer 队列。调用后的 req.count 是驱动
     * 实际接受的数量，后续循环必须使用它，不能继续写死为 4。
     */
    if (xioctl(fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS");
        exit(EXIT_FAILURE);
    }

    if (req.count < 2) {
        fprintf(stderr, "driver returned fewer than two buffers\n");
        exit(EXIT_FAILURE);
    }

    printf("driver buffers   : %u\n", req.count);
    return req.count;
}

static struct mapped_buffer *map_buffers(int fd, unsigned int count)
{
    struct mapped_buffer *buffers;

    /* 这里只分配应用登记表；驱动 Buffer 已由 REQBUFS 创建。 */
    buffers = calloc(count, sizeof(*buffers));
    if (!buffers) {
        perror("calloc");
        exit(EXIT_FAILURE);
    }

    for (unsigned int index = 0; index < count; ++index) {
        struct v4l2_buffer buf;
        struct v4l2_plane planes[VIDEO_MAX_PLANES];

        memset(&buf, 0, sizeof(buf));
        memset(planes, 0, sizeof(planes));

        /* QUERYBUF 的输入：队列类型、内存类型和要查询的 Buffer 下标。 */
        buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf.memory = V4L2_MEMORY_MMAP;
        buf.index = index;
        buf.length = VIDEO_MAX_PLANES;
        buf.m.planes = planes;

        /* 驱动回填每个 Plane 的 length 和 mmap offset。 */
        if (xioctl(fd, VIDIOC_QUERYBUF, &buf) == -1) {
            perror("VIDIOC_QUERYBUF");
            exit(EXIT_FAILURE);
        }

        buffers[index].num_planes = buf.length;
        for (unsigned int plane = 0; plane < buf.length; ++plane) {
            buffers[index].length[plane] = planes[plane].length;

            /*
             * mmap 不复制图像，只把同一块底层 Buffer 映射到本进程地址空间。
             * Day4 暂不读取 start[]；Day5 保存 NV12 时才会真正使用该地址。
             */
            buffers[index].start[plane] = mmap(NULL,
                                                planes[plane].length,
                                                PROT_READ | PROT_WRITE,
                                                MAP_SHARED,
                                                fd,
                                                planes[plane].m.mem_offset);
            if (buffers[index].start[plane] == MAP_FAILED) {
                perror("mmap");
                exit(EXIT_FAILURE);
            }
        }
    }

    return buffers;
}

static void queue_one_buffer(int fd,
                             unsigned int index,
                             unsigned int num_planes)
{
    struct v4l2_buffer buf;
    struct v4l2_plane planes[VIDEO_MAX_PLANES];

    memset(&buf, 0, sizeof(buf));
    memset(planes, 0, sizeof(planes));

    buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    buf.memory = V4L2_MEMORY_MMAP;
    buf.index = index;
    buf.length = num_planes;
    buf.m.planes = planes;

    /*
     * QBUF 的 Q 是 Queue：应用把一个当前不用的 Buffer 所有权交给驱动。
     * 对 Capture 队列来说，交出去的是“等待硬件写入的空容器”，不是已经
     * 准备好的图像。驱动接管后它会经历 QUEUED -> ACTIVE -> DONE。
     */
    if (xioctl(fd, VIDIOC_QBUF, &buf) == -1) {
        perror("VIDIOC_QBUF");
        exit(EXIT_FAILURE);
    }
}

static void queue_all_buffers(int fd,
                              const struct mapped_buffer *buffers,
                              unsigned int count)
{
    /* STREAMON 前先准备足够的空 Buffer，避免硬件启动后无处写帧。 */
    for (unsigned int index = 0; index < count; ++index)
        queue_one_buffer(fd, index, buffers[index].num_planes);

    printf("queued buffers   : %u\n", count);
}

static void start_streaming(int fd)
{
    enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

    /*
     * STREAMON 启动的是这条 Capture 队列及其上游 Camera pipeline。
     * 返回 0 只说明启动调用链没有立即报错；是否真的有帧，还要看 poll、
     * DQBUF、sequence 和 bytesused。
     */
    if (xioctl(fd, VIDIOC_STREAMON, &type) == -1) {
        perror("VIDIOC_STREAMON");
        exit(EXIT_FAILURE);
    }

    printf("stream status    : ON\n");
}

static void wait_until_frame_ready(int fd)
{
    struct pollfd pfd;
    int ret;

    memset(&pfd, 0, sizeof(pfd));
    pfd.fd = fd;
    pfd.events = POLLIN | POLLPRI;

    /* poll 只等待“有完成 Buffer 可取”，本身不会把 Buffer 交给应用。 */
    do {
        ret = poll(&pfd, 1, FRAME_TIMEOUT_MS);
    } while (ret == -1 && errno == EINTR);

    if (ret == -1) {
        perror("poll");
        exit(EXIT_FAILURE);
    }

    if (ret == 0) {
        fprintf(stderr, "poll timeout after %d ms\n", FRAME_TIMEOUT_MS);
        exit(EXIT_FAILURE);
    }

    if (pfd.revents & (POLLERR | POLLHUP | POLLNVAL)) {
        fprintf(stderr, "poll returned error events: 0x%x\n", pfd.revents);
        exit(EXIT_FAILURE);
    }
}

static void capture_frames(int fd,
                           const struct mapped_buffer *buffers,
                           unsigned int buffer_count)
{
    for (unsigned int frame = 0; frame < CAPTURE_FRAME_COUNT; ++frame) {
        struct v4l2_buffer buf;
        struct v4l2_plane planes[VIDEO_MAX_PLANES];

        /*
         * O_NONBLOCK 模式下，即使 poll 刚刚提示就绪，DQBUF 理论上仍可能因
         * 竞争返回 EAGAIN；遇到它就重新 poll，而不是把它当成 Camera 故障。
         */
        for (;;) {
            wait_until_frame_ready(fd);

            memset(&buf, 0, sizeof(buf));
            memset(planes, 0, sizeof(planes));
            buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
            buf.memory = V4L2_MEMORY_MMAP;
            buf.length = VIDEO_MAX_PLANES;
            buf.m.planes = planes;

            if (xioctl(fd, VIDIOC_DQBUF, &buf) == 0)
                break;
            if (errno != EAGAIN) {
                perror("VIDIOC_DQBUF");
                exit(EXIT_FAILURE);
            }
        }

        if (buf.index >= buffer_count) {
            fprintf(stderr, "driver returned invalid buffer index %u\n", buf.index);
            exit(EXIT_FAILURE);
        }

        /*
         * DQBUF 的 DQ 是 Dequeue：驱动把一个 DONE Buffer 的所有权交还应用。
         * index      决定应读取 buffers[index].start[] 中的哪块映射；
         * sequence   是驱动记录的帧序号，可用于发现丢帧或不连续；
         * timestamp  是该帧的时间戳；
         * bytesused  是当前 Plane 中本帧实际有效的数据字节数；
         * flags      描述错误、时间戳类型等状态。
         */
        printf("frame[%02u] index=%u sequence=%u timestamp=%ld.%06ld flags=0x%08x",
               frame,
               buf.index,
               buf.sequence,
               (long)buf.timestamp.tv_sec,
               (long)buf.timestamp.tv_usec,
               buf.flags);

        for (unsigned int plane = 0; plane < buf.length; ++plane)
            printf(" plane[%u].bytesused=%u", plane, planes[plane].bytesused);
        putchar('\n');

        /*
         * Day4 打印完元数据便不再使用这帧，所以立即重新 QBUF。
         * 如果不归还，驱动可用空 Buffer 会逐渐减少；全部被应用占住后，
         * Camera 即使仍在工作也没有容器可写，连续采集就会停住。
         */
        queue_one_buffer(fd, buf.index, buffers[buf.index].num_planes);
    }
}

static void stop_streaming(int fd)
{
    enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

    /* STREAMOFF 停止管线，并把队列中的 Buffer 退回非流状态。 */
    if (xioctl(fd, VIDIOC_STREAMOFF, &type) == -1) {
        perror("VIDIOC_STREAMOFF");
        exit(EXIT_FAILURE);
    }

    printf("stream status    : OFF\n");
}

static void unmap_buffers(struct mapped_buffer *buffers, unsigned int count)
{
    /* STREAMOFF 后再撤销每个 Buffer/Plane 的用户虚拟地址映射。 */
    for (unsigned int index = 0; index < count; ++index) {
        for (unsigned int plane = 0;
             plane < buffers[index].num_planes;
             ++plane) {
            if (munmap(buffers[index].start[plane],
                       buffers[index].length[plane]) == -1) {
                perror("munmap");
                exit(EXIT_FAILURE);
            }
        }
    }

    /* 这里只释放应用登记表。 */
    free(buffers);
}

static void release_buffer_queue(int fd)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    req.count = 0;
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    req.memory = V4L2_MEMORY_MMAP;

    /* REQBUFS(count=0) 才是释放驱动/VB2 侧 Buffer 队列。 */
    if (xioctl(fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS(count=0)");
        exit(EXIT_FAILURE);
    }
}

int main(int argc, char **argv)
{
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    struct mapped_buffer *buffers;
    unsigned int buffer_count;
    int fd;

    /*
     * O_NONBLOCK 防止 DQBUF 在异常链路上无限阻塞；是否有帧由 poll 的
     * 2 秒超时明确控制。open 成功只证明节点可打开，不证明能出流。
     */
    fd = open(device, O_RDWR | O_NONBLOCK);
    if (fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        return EXIT_FAILURE;
    }

    set_format(fd);
    buffer_count = request_buffers(fd);
    buffers = map_buffers(fd, buffer_count);

    /* 开流前所有 Buffer 必须先排队。 */
    queue_all_buffers(fd, buffers, buffer_count);
    start_streaming(fd);

    /* 真正的有效帧证据从 poll 成功和 DQBUF 返回开始。 */
    capture_frames(fd, buffers, buffer_count);
    printf("captured frames  : %u\n", CAPTURE_FRAME_COUNT);

    /* 按与初始化相反的顺序收尾。 */
    stop_streaming(fd);
    unmap_buffers(buffers, buffer_count);
    release_buffer_queue(fd);

    if (close(fd) == -1) {
        perror("close");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
