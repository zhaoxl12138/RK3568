/*
 * Day 3：申请 V4L2 MMAP Buffer，查询每个内存 Plane 并映射到用户空间。
 *
 * 执行链：
 *   open -> S_FMT -> REQBUFS -> QUERYBUF -> mmap
 *        -> munmap -> REQBUFS(count=0) -> close
 *
 * 本程序不会 QBUF，也不会 STREAMON，因此不会获得图像帧。
 */

/* errno / EINTR：处理系统调用失败以及信号中断。 */
#include <errno.h>
/* open()、O_RDWR。 */
#include <fcntl.h>
/* V4L2 用户态结构体、Buffer 类型、Memory 类型与 VIDIOC_* 命令。 */
#include <linux/videodev2.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
/* mmap()、munmap()、PROT_* 和 MAP_*。 */
#include <sys/mman.h>
#include <unistd.h>

struct mapped_buffer {
    /* 驱动通过 QUERYBUF 返回这个 Buffer 实际包含几个内存 Plane。 */
    unsigned int num_planes;
    /* 每个元素保存 mmap() 返回的用户虚拟地址。 */
    void *start[VIDEO_MAX_PLANES];
    /* munmap() 时必须使用与 mmap() 相同的长度，因此逐 Plane 保存。 */
    size_t length[VIDEO_MAX_PLANES];
};

/*
 * mapped_buffer 是本程序自己的“映射登记表”，不是 V4L2 内核对象：
 *
 *   驱动队列中的 Buffer  ──QUERYBUF──> 长度 + mmap 偏移
 *                                     ↓
 *   mapped_buffer[index]  <──保存── 用户虚拟地址 + 长度
 *
 * 它只帮助应用记住映射结果，不会让 Buffer 自动进入采集队列。
 */

static int xioctl(int fd, unsigned long request, void *arg)
{
    int ret;

    /*
     * arg 指向的 UAPI 结构体是双向通信区：应用先填输入字段，驱动再回填结果。
     * 被信号打断的 EINTR 可以重试；其他错误由调用处结合命令名报告。
     */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static void set_format(int fd)
{
    /* S_FMT 使用的通用格式容器；type 决定读取 union 中的 pix_mp。 */
    struct v4l2_format fmt;

    /* 先清零所有保留字段，再填写应用期望的 NV12 4K 参数。 */
    memset(&fmt, 0, sizeof(fmt));
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    fmt.fmt.pix_mp.width = 3840;
    fmt.fmt.pix_mp.height = 2160;
    fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
    fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

    /*
     * S_FMT 成功后，fmt 已被驱动回填为实际接受值。Day3 后续申请的 Buffer
     * 大小会以这个格式为基础；但仅 S_FMT 成功仍不能证明可以出帧。
     */
    if (xioctl(fd, VIDIOC_S_FMT, &fmt) == -1) {
        perror("VIDIOC_S_FMT");
        exit(EXIT_FAILURE);
    }

    printf("format            : NV12 %ux%u, planes=%u\n",
           fmt.fmt.pix_mp.width,
           fmt.fmt.pix_mp.height,
           fmt.fmt.pix_mp.num_planes);
}

static unsigned int request_buffers(int fd, unsigned int requested)
{
    /* 应用用 req 描述“向哪个队列、以何种内存方式、申请多少 Buffer”。 */
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    /* requested 是期望数量；驱动有权调整，返回后的 req.count 才是事实。 */
    req.count = requested;
    /* 必须与前面 S_FMT 使用的 Capture MPlane 队列一致。 */
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    /* MMAP 表示 Buffer 由驱动侧建立，应用随后用 QUERYBUF+mmap 映射它。 */
    req.memory = V4L2_MEMORY_MMAP;

    printf("requested buffers : %u\n", requested);
    /*
     * REQBUFS 建立 VB2 队列中的 Buffer 对象，但此时应用还没有用户虚拟地址，
     * Buffer 也还没有通过 QBUF 排入采集队列。
     */
    if (xioctl(fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS");
        exit(EXIT_FAILURE);
    }

    /* 驱动把实际分配数量写回 req.count，所以不能继续盲用 requested。 */
    printf("driver buffers    : %u\n", req.count);
    if (req.count < 2) {
        fprintf(stderr, "driver returned fewer than two buffers\n");
        exit(EXIT_FAILURE);
    }

    return req.count;
}

static struct mapped_buffer *map_buffers(int fd, unsigned int count)
{
    struct mapped_buffer *buffers;

    /*
     * calloc 只分配应用自己的登记表，并把它清零；真正的 V4L2 Buffer 已由
     * REQBUFS 在驱动/VB2 侧建立。sizeof(*buffers) 可避免重复写结构体类型名。
     */
    buffers = calloc(count, sizeof(*buffers));
    if (!buffers) {
        perror("calloc");
        exit(EXIT_FAILURE);
    }

    for (unsigned int index = 0; index < count; ++index) {
        /* buf 描述“第 index 个 V4L2 Buffer”。 */
        struct v4l2_buffer buf;
        /*
         * MPlane API 不把各 Plane 信息直接塞在 buf 中，而是让 buf.m.planes
         * 指向调用者准备的 v4l2_plane 数组。
         */
        struct v4l2_plane planes[VIDEO_MAX_PLANES];

        /* 每次查询一个 Buffer，都要清除上一次循环可能留下的数据。 */
        memset(&buf, 0, sizeof(buf));
        memset(planes, 0, sizeof(planes));

        /* 下面五项是 QUERYBUF 的输入条件，告诉驱动“我要查哪个 Buffer”。 */
        buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf.memory = V4L2_MEMORY_MMAP;
        buf.index = index;
        /*
         * 调用前：length 表示 planes[] 最多可容纳多少项；
         * 调用后：驱动把它改成这个 Buffer 实际包含的 Plane 数量。
         */
        buf.length = VIDEO_MAX_PLANES;
        /* buf.m 是 union；MPlane 接口必须令 m.planes 指向上面的数组。 */
        buf.m.planes = planes;

        /*
         * QUERYBUF 不返回一帧图像。它返回 Buffer 的元数据，尤其是每个 Plane
         * 的 length 和 mem_offset，供后面的 mmap() 使用。
         */
        if (xioctl(fd, VIDIOC_QUERYBUF, &buf) == -1) {
            perror("VIDIOC_QUERYBUF");
            exit(EXIT_FAILURE);
        }

        /* 保存驱动回填的 Plane 数，供映射和最终 munmap 循环使用。 */
        buffers[index].num_planes = buf.length;
        for (unsigned int plane = 0; plane < buf.length; ++plane) {
            /*
             * 注意两个 length 含义不同：
             *   buf.length              = Plane 的个数；
             *   planes[plane].length    = 当前 Plane 的字节长度。
             */
            buffers[index].length[plane] = planes[plane].length;
            /*
             * mmap 并不复制整块图像内存。它把驱动 Buffer 的某个 Plane 映射到
             * 当前进程地址空间：
             *   NULL                  让内核选择用户虚拟地址；
             *   PROT_READ|PROT_WRITE  允许应用读写；
             *   MAP_SHARED            与驱动共享同一块底层存储；
             *   fd + mem_offset       定位该 Video Node 的具体 Plane。
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

            /* address 是应用以后访问该 Buffer 内容时使用的用户虚拟地址。 */
            printf("buffer[%u] plane[%u]: length=%u, offset=0x%x, address=%p\n",
                   index,
                   plane,
                   planes[plane].length,
                   planes[plane].m.mem_offset,
                   buffers[index].start[plane]);
        }
    }

    return buffers;
}

static void unmap_buffers(struct mapped_buffer *buffers, unsigned int count)
{
    /*
     * 按“每个 Buffer 的每个 Plane”撤销用户态映射。
     * munmap 只解除当前进程的虚拟地址映射，不等于释放驱动的 VB2 队列。
     */
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

    /* 释放的只是 calloc 创建的应用登记表。 */
    free(buffers);
}

static void release_buffer_queue(int fd)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    /*
     * 对同一 type/memory 再发一次 REQBUFS(count=0)，语义是释放驱动侧队列。
     * 正确顺序是先 munmap 用户映射，再让驱动销毁这些 Buffer。
     */
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
    /* 允许命令行选择节点；不传参数时默认 /dev/video0。 */
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    /* 指向应用自己的映射登记表。 */
    struct mapped_buffer *buffers;
    /* 保存驱动实际返回的 Buffer 数量，而不是固定使用请求值 4。 */
    unsigned int count;
    /* 当前进程访问 Video Node 的文件描述符。 */
    int fd;

    /* O_RDWR 是 V4L2 Capture/Streaming 节点最通用的打开方式。 */
    fd = open(device, O_RDWR);
    if (fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        return EXIT_FAILURE;
    }

    /*
     * Day3 的核心顺序：
     *   S_FMT              确定 Buffer 应匹配的图像格式；
     *   REQBUFS            在驱动/VB2 侧建立 Buffer；
     *   QUERYBUF + mmap    把每个 Plane 映射到应用地址空间。
     *
     * 到这里 Buffer 通常仍未进入采集队列，因为没有 QBUF；也没有 STREAMON，
     * 所以映射成功只能证明内存通路准备完成，不能证明 Camera 已经出帧。
     */
    set_format(fd);
    count = request_buffers(fd, 4);
    buffers = map_buffers(fd, count);

    /* 本练习不取帧，验证完映射后按相反顺序清理资源。 */
    unmap_buffers(buffers, count);
    release_buffer_queue(fd);

    /* 所有映射和驱动 Buffer 已释放后，再关闭 Video Node。 */
    if (close(fd) == -1) {
        perror("close");
        return EXIT_FAILURE;
    }

    printf("all buffers unmapped and released\n");
    return EXIT_SUCCESS;
}
