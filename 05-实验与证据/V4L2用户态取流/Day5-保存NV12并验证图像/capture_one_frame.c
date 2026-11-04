/*
 * Day 5：从 /dev/video0 取得第一个完成的 NV12 Buffer，并保存成原始文件。
 *
 * Day4 已经证明能够连续 DQBUF；Day5 只增加一个动作：
 *
 *   DQBUF 返回 buf.index 和 planes[p].bytesused
 *       -> 用 buf.index 找到 Day3 mmap 保存的用户虚拟地址
 *       -> 按 bytesused 写入 frame_000.nv12
 *       -> 重新 QBUF
 *
 * 程序不会进行颜色转换。NV12 转 PNG 在电脑端使用 FFmpeg 完成。
 */

#include <errno.h>
#include <fcntl.h>
#include <linux/videodev2.h>
#include <poll.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <unistd.h>

#define REQUEST_WIDTH 3840U
#define REQUEST_HEIGHT 2160U
#define REQUEST_BUFFER_COUNT 4U
#define FRAME_TIMEOUT_MS 2000

/*
 * 这是应用自己的映射登记表：
 *   start[p]  是 mmap 返回的用户虚拟地址；
 *   length[p] 是该映射的总容量；
 *   num_planes 是该 Buffer 实际包含的内存 Plane 数。
 *
 * 它不保存 Buffer 当前状态；状态由驱动/VB2 队列管理。
 */
struct mapped_buffer {
    unsigned int num_planes;
    void *start[VIDEO_MAX_PLANES];
    size_t length[VIDEO_MAX_PLANES];
};

static int xioctl(int fd, unsigned long request, void *arg)
{
    int ret;

    /* 被信号打断的 ioctl 可以重试，其他错误保留给调用者处理。 */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static void set_format(int fd)
{
    struct v4l2_format fmt;

    memset(&fmt, 0, sizeof(fmt));
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    fmt.fmt.pix_mp.width = REQUEST_WIDTH;
    fmt.fmt.pix_mp.height = REQUEST_HEIGHT;
    fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
    fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

    /* S_FMT 是双向协商；成功后打印的是驱动回填的实际结果。 */
    if (xioctl(fd, VIDIOC_S_FMT, &fmt) == -1) {
        perror("VIDIOC_S_FMT");
        exit(EXIT_FAILURE);
    }

    printf("format           : NV12 %ux%u, planes=%u\n",
           fmt.fmt.pix_mp.width,
           fmt.fmt.pix_mp.height,
           fmt.fmt.pix_mp.num_planes);

    for (unsigned int plane = 0;
         plane < fmt.fmt.pix_mp.num_planes;
         ++plane) {
        printf("format plane[%u] : bytesperline=%u sizeimage=%u\n",
               plane,
               fmt.fmt.pix_mp.plane_fmt[plane].bytesperline,
               fmt.fmt.pix_mp.plane_fmt[plane].sizeimage);
    }
}

static unsigned int request_buffers(int fd)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    req.count = REQUEST_BUFFER_COUNT;
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    req.memory = V4L2_MEMORY_MMAP;

    if (xioctl(fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS");
        exit(EXIT_FAILURE);
    }

    if (req.count < 2) {
        fprintf(stderr, "driver returned fewer than two buffers\n");
        exit(EXIT_FAILURE);
    }

    /* req.count 是驱动返回的实际数量，后续所有循环均使用它。 */
    printf("driver buffers   : %u\n", req.count);
    return req.count;
}

static struct mapped_buffer *map_buffers(int fd, unsigned int count)
{
    struct mapped_buffer *buffers;

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
        buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf.memory = V4L2_MEMORY_MMAP;
        buf.index = index;
        buf.length = VIDEO_MAX_PLANES;
        buf.m.planes = planes;

        /* QUERYBUF 返回实际 Plane 数、各 Plane 容量和 mmap 偏移量。 */
        if (xioctl(fd, VIDIOC_QUERYBUF, &buf) == -1) {
            perror("VIDIOC_QUERYBUF");
            exit(EXIT_FAILURE);
        }

        buffers[index].num_planes = buf.length;
        for (unsigned int plane = 0; plane < buf.length; ++plane) {
            buffers[index].length[plane] = planes[plane].length;
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

    /* Capture QBUF：把等待写入的 Buffer 所有权交给驱动。 */
    if (xioctl(fd, VIDIOC_QBUF, &buf) == -1) {
        perror("VIDIOC_QBUF");
        exit(EXIT_FAILURE);
    }
}

static void queue_all_buffers(int fd,
                              const struct mapped_buffer *buffers,
                              unsigned int count)
{
    for (unsigned int index = 0; index < count; ++index)
        queue_one_buffer(fd, index, buffers[index].num_planes);

    printf("queued buffers   : %u\n", count);
}

static void start_streaming(int fd)
{
    enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

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

    /* poll 只等待完成事件；真正取回 Buffer 仍要调用 DQBUF。 */
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

static void dequeue_one_frame(int fd,
                              struct v4l2_buffer *buf,
                              struct v4l2_plane planes[VIDEO_MAX_PLANES])
{
    for (;;) {
        wait_until_frame_ready(fd);

        memset(buf, 0, sizeof(*buf));
        memset(planes, 0, sizeof(struct v4l2_plane) * VIDEO_MAX_PLANES);
        buf->type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf->memory = V4L2_MEMORY_MMAP;
        buf->length = VIDEO_MAX_PLANES;
        buf->m.planes = planes;

        /*
         * DQBUF 成功后：
         *   buf->index 告诉应用哪一个 mmap Buffer 已完成；
         *   planes[p].bytesused 告诉应用本帧有效数据长度；
         *   planes[p].data_offset 告诉应用有效数据从 Plane 的哪里开始。
         */
        if (xioctl(fd, VIDIOC_DQBUF, buf) == 0)
            return;
        if (errno != EAGAIN) {
            perror("VIDIOC_DQBUF");
            exit(EXIT_FAILURE);
        }
    }
}

static size_t save_frame(const char *path,
                         const struct mapped_buffer *buffers,
                         unsigned int buffer_count,
                         const struct v4l2_buffer *buf,
                         const struct v4l2_plane planes[VIDEO_MAX_PLANES])
{
    FILE *output;
    size_t total_written = 0;

    if (buf->index >= buffer_count) {
        fprintf(stderr, "driver returned invalid buffer index %u\n", buf->index);
        exit(EXIT_FAILURE);
    }
    if (buf->length > buffers[buf->index].num_planes) {
        fprintf(stderr, "driver returned invalid plane count %u\n", buf->length);
        exit(EXIT_FAILURE);
    }

    /* wb：以二进制方式创建/覆盖原始 NV12 文件。 */
    output = fopen(path, "wb");
    if (!output) {
        fprintf(stderr, "open output %s: %s\n", path, strerror(errno));
        exit(EXIT_FAILURE);
    }

    for (unsigned int plane = 0; plane < buf->length; ++plane) {
        size_t bytesused = planes[plane].bytesused;
        size_t data_offset = planes[plane].data_offset;
        size_t valid_bytes;
        const unsigned char *data;

        /*
         * length 是这块映射的总容量；bytesused 是本帧驱动声明的有效范围。
         * 必须先校验，避免驱动异常值导致应用越界读取 mmap 区域。
         */
        if (bytesused > buffers[buf->index].length[plane]
            || data_offset > bytesused) {
            fprintf(stderr,
                    "invalid plane[%u]: length=%zu bytesused=%zu offset=%zu\n",
                    plane,
                    buffers[buf->index].length[plane],
                    bytesused,
                    data_offset);
            fclose(output);
            exit(EXIT_FAILURE);
        }

        /*
         * start 指向整个 Plane 的 mmap 首地址。若 data_offset 非 0，真正有效
         * 数据从 start + data_offset 开始；当前 NV12 实测 offset 为 0。
         */
        data = (const unsigned char *)buffers[buf->index].start[plane]
               + data_offset;
        valid_bytes = bytesused - data_offset;

        if (fwrite(data, 1, valid_bytes, output) != valid_bytes) {
            fprintf(stderr, "write %s failed\n", path);
            fclose(output);
            exit(EXIT_FAILURE);
        }

        printf("saved plane[%u]  : bytesused=%zu data_offset=%zu written=%zu\n",
               plane, bytesused, data_offset, valid_bytes);
        total_written += valid_bytes;
    }

    if (fclose(output) == EOF) {
        perror("fclose output");
        exit(EXIT_FAILURE);
    }

    printf("saved frame      : %s\n", path);
    printf("bytes written    : %zu\n", total_written);
    return total_written;
}

static void stop_streaming(int fd)
{
    enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

    if (xioctl(fd, VIDIOC_STREAMOFF, &type) == -1) {
        perror("VIDIOC_STREAMOFF");
        exit(EXIT_FAILURE);
    }

    printf("stream status    : OFF\n");
}

static void unmap_buffers(struct mapped_buffer *buffers, unsigned int count)
{
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

    free(buffers);
}

static void release_buffer_queue(int fd)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    req.count = 0;
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    req.memory = V4L2_MEMORY_MMAP;

    if (xioctl(fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS(count=0)");
        exit(EXIT_FAILURE);
    }
}

int main(int argc, char **argv)
{
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    const char *output_path = (argc > 2) ? argv[2] : "frame_000.nv12";
    struct mapped_buffer *buffers;
    struct v4l2_buffer buf;
    struct v4l2_plane planes[VIDEO_MAX_PLANES];
    unsigned int buffer_count;
    int fd;

    fd = open(device, O_RDWR | O_NONBLOCK);
    if (fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        return EXIT_FAILURE;
    }

    set_format(fd);
    buffer_count = request_buffers(fd);
    buffers = map_buffers(fd, buffer_count);
    queue_all_buffers(fd, buffers, buffer_count);
    start_streaming(fd);

    /*
     * 只有 DQBUF 成功后，应用才重新取得这个 Buffer 的所有权，此时才能
     * 安全读取 buffers[buf.index].start[] 并保存 bytesused 范围的数据。
     */
    dequeue_one_frame(fd, &buf, planes);
    printf("dequeued frame   : index=%u sequence=%u planes=%u\n",
           buf.index, buf.sequence, buf.length);
    save_frame(output_path, buffers, buffer_count, &buf, planes);

    /* 保存完成后归还 Buffer，再停止管线。 */
    queue_one_buffer(fd, buf.index, buffers[buf.index].num_planes);
    stop_streaming(fd);

    unmap_buffers(buffers, buffer_count);
    release_buffer_queue(fd);

    if (close(fd) == -1) {
        perror("close");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
