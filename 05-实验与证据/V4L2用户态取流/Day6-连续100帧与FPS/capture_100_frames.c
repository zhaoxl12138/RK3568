/*
 * Day 6：连续采集 100 帧，并统计实际帧率、sequence 缺口、poll 超时和
 *        bytesused 范围。
 *
 * 本程序在 Day4“能连续 DQBUF/QBUF”的基础上，补齐一个可验收的小工具：
 *
 *   open
 *     -> VIDIOC_S_FMT
 *     -> VIDIOC_REQBUFS
 *     -> VIDIOC_QUERYBUF + mmap
 *     -> VIDIOC_QBUF（全部 Buffer）
 *     -> VIDIOC_STREAMON
 *     -> poll + VIDIOC_DQBUF + VIDIOC_QBUF（重复 100 次）
 *     -> 统计 FPS / sequence gap / timeout / bytesused
 *     -> VIDIOC_STREAMOFF
 *     -> munmap
 *     -> VIDIOC_REQBUFS(count=0)
 *     -> close
 *
 * Day6 的重点不是多写一次循环，而是回答四个工程问题：
 *
 *   1. Camera 能否持续返回帧，而不是偶尔成功一次？
 *   2. 100 帧的平均速率是否接近目标 30 FPS？
 *   3. 驱动返回的 sequence 是否连续？
 *   4. 任何中途错误发生后，资源能否仍然被完整释放？
 */

/* errno、EINTR、EAGAIN。 */
#include <errno.h>
/* open()、O_RDWR、O_NONBLOCK。 */
#include <fcntl.h>
/* V4L2 UAPI：VIDIOC_*、v4l2_buffer、v4l2_plane 等。 */
#include <linux/videodev2.h>
/* poll()：带超时地等待完成 Buffer。 */
#include <poll.h>
/* bool、true、false。 */
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
/* mmap()、munmap()。 */
#include <sys/mman.h>
/* clock_gettime()、struct timespec。 */
#include <time.h>
#include <unistd.h>

#define REQUEST_WIDTH 3840U
#define REQUEST_HEIGHT 2160U
#define REQUEST_BUFFER_COUNT 4U
#define CAPTURE_FRAME_COUNT 100U
#define FRAME_TIMEOUT_MS 2000
#define MAX_CONSECUTIVE_TIMEOUTS 3U

/*
 * 应用侧的“映射登记表”。
 *
 * start/length 只说明：某个驱动 Buffer 的 Plane 映射到了本进程哪里。
 * 它不是内核中的 VB2 Buffer，也不保存 QUEUED/ACTIVE/DONE 状态；这些状态
 * 仍由内核 VB2 队列管理。
 */
struct mapped_buffer {
    unsigned int num_planes;
    void *start[VIDEO_MAX_PLANES];
    size_t length[VIDEO_MAX_PLANES];
};

/*
 * 把“已经取得了哪些资源”集中保存起来，方便统一 cleanup。
 *
 * queue_allocated 和 streaming 很重要：错误可能发生在初始化的任意一步，
 * cleanup 只能释放已经成功取得的资源，不能假设所有步骤都已完成。
 */
struct capture_context {
    int fd;
    struct mapped_buffer *buffers;
    unsigned int buffer_count;
    bool queue_allocated;
    bool streaming;
};

/* 100 帧验收需要的统计数据，不参与驱动控制。 */
struct capture_stats {
    unsigned int frame_count;
    unsigned int poll_timeouts;
    unsigned int sequence_gaps;
    unsigned int first_sequence;
    unsigned int last_sequence;
    unsigned int previous_sequence;
    bool have_previous_sequence;
    size_t min_bytesused;
    size_t max_bytesused;
    struct timespec first_frame_time;
    struct timespec last_frame_time;
};

static int xioctl(int fd, unsigned long request, void *arg)
{
    int ret;

    /*
     * ioctl 被信号打断时 errno == EINTR。此时命令并不代表执行失败，重试即可。
     * 这里不吞掉其他错误，调用者仍能依据 errno 打印具体原因并统一清理。
     */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static int set_format(int fd)
{
    struct v4l2_format fmt;

    memset(&fmt, 0, sizeof(fmt));
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    fmt.fmt.pix_mp.width = REQUEST_WIDTH;
    fmt.fmt.pix_mp.height = REQUEST_HEIGHT;
    fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
    fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

    /*
     * S_FMT 是“请求并让驱动回填最终格式”，不是保证硬件已经出流。
     * 调用成功后必须打印驱动返回值，因为驱动可以调整尺寸、格式或 Plane 数。
     */
    if (xioctl(fd, VIDIOC_S_FMT, &fmt) == -1) {
        perror("VIDIOC_S_FMT");
        return -1;
    }

    printf("format           : NV12 %ux%u, planes=%u\n",
           fmt.fmt.pix_mp.width,
           fmt.fmt.pix_mp.height,
           fmt.fmt.pix_mp.num_planes);
    return 0;
}

static int request_buffers(struct capture_context *ctx)
{
    struct v4l2_requestbuffers req;

    memset(&req, 0, sizeof(req));
    req.count = REQUEST_BUFFER_COUNT;
    req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    req.memory = V4L2_MEMORY_MMAP;

    /*
     * REQBUFS 让 VB2/驱动创建 Capture 队列中的 Buffer。
     * 请求 4 个不等于一定得到 4 个，后面只能使用驱动回填的 req.count。
     */
    if (xioctl(ctx->fd, VIDIOC_REQBUFS, &req) == -1) {
        perror("VIDIOC_REQBUFS");
        return -1;
    }

    ctx->queue_allocated = true;
    ctx->buffer_count = req.count;

    if (ctx->buffer_count < 2) {
        fprintf(stderr, "driver returned fewer than two buffers\n");
        return -1;
    }

    printf("driver buffers   : %u\n", ctx->buffer_count);
    return 0;
}

static int map_buffers(struct capture_context *ctx)
{
    /* calloc 清零后，未映射的 start[] 为 NULL，cleanup 可以安全跳过。 */
    ctx->buffers = calloc(ctx->buffer_count, sizeof(*ctx->buffers));
    if (!ctx->buffers) {
        perror("calloc");
        return -1;
    }

    for (unsigned int index = 0; index < ctx->buffer_count; ++index) {
        struct v4l2_buffer buf;
        struct v4l2_plane planes[VIDEO_MAX_PLANES];

        memset(&buf, 0, sizeof(buf));
        memset(planes, 0, sizeof(planes));
        buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf.memory = V4L2_MEMORY_MMAP;
        buf.index = index;
        buf.length = VIDEO_MAX_PLANES;
        buf.m.planes = planes;

        /* QUERYBUF 回填每个 Plane 的长度和 mmap offset。 */
        if (xioctl(ctx->fd, VIDIOC_QUERYBUF, &buf) == -1) {
            perror("VIDIOC_QUERYBUF");
            return -1;
        }

        if (buf.length == 0 || buf.length > VIDEO_MAX_PLANES) {
            fprintf(stderr, "invalid plane count %u for buffer %u\n",
                    buf.length, index);
            return -1;
        }

        ctx->buffers[index].num_planes = buf.length;

        for (unsigned int plane = 0; plane < buf.length; ++plane) {
            void *address;

            ctx->buffers[index].length[plane] = planes[plane].length;
            address = mmap(NULL,
                           planes[plane].length,
                           PROT_READ | PROT_WRITE,
                           MAP_SHARED,
                           ctx->fd,
                           planes[plane].m.mem_offset);
            if (address == MAP_FAILED) {
                perror("mmap");
                return -1;
            }

            /* mmap 不复制图像，只建立用户虚拟地址到同一底层 Buffer 的映射。 */
            ctx->buffers[index].start[plane] = address;
        }
    }

    return 0;
}

static int queue_one_buffer(const struct capture_context *ctx,
                            unsigned int index)
{
    struct v4l2_buffer buf;
    struct v4l2_plane planes[VIDEO_MAX_PLANES];

    if (index >= ctx->buffer_count) {
        fprintf(stderr, "cannot queue invalid buffer index %u\n", index);
        return -1;
    }

    memset(&buf, 0, sizeof(buf));
    memset(planes, 0, sizeof(planes));
    buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    buf.memory = V4L2_MEMORY_MMAP;
    buf.index = index;
    buf.length = ctx->buffers[index].num_planes;
    buf.m.planes = planes;

    /*
     * Capture 场景下，QBUF 是把“空容器”的使用权交给驱动，等待 DMA 写入。
     * 它不是把图像从应用复制给驱动。
     */
    if (xioctl(ctx->fd, VIDIOC_QBUF, &buf) == -1) {
        perror("VIDIOC_QBUF");
        return -1;
    }

    return 0;
}

static int queue_all_buffers(const struct capture_context *ctx)
{
    /* STREAMON 前先排队所有 Buffer，避免启动后没有可写容器。 */
    for (unsigned int index = 0; index < ctx->buffer_count; ++index) {
        if (queue_one_buffer(ctx, index) == -1)
            return -1;
    }

    printf("queued buffers   : %u\n", ctx->buffer_count);
    return 0;
}

static int start_streaming(struct capture_context *ctx)
{
    enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

    /*
     * STREAMON 成功只证明启动调用链没有立即报错；真正出帧还必须有 poll 就绪、
     * DQBUF 成功和有效 bytesused。
     */
    if (xioctl(ctx->fd, VIDIOC_STREAMON, &type) == -1) {
        perror("VIDIOC_STREAMON");
        return -1;
    }

    ctx->streaming = true;
    printf("stream status    : ON\n");
    return 0;
}

/*
 * 返回值：
 *   0  = 有事件，可以尝试 DQBUF；
 *   1  = 本次等待超时；
 *  -1  = poll 或设备事件异常。
 */
static int wait_until_frame_ready(int fd)
{
    struct pollfd pfd;
    int ret;

    memset(&pfd, 0, sizeof(pfd));
    pfd.fd = fd;
    pfd.events = POLLIN | POLLPRI;

    do {
        ret = poll(&pfd, 1, FRAME_TIMEOUT_MS);
    } while (ret == -1 && errno == EINTR);

    if (ret == -1) {
        perror("poll");
        return -1;
    }

    if (ret == 0)
        return 1;

    if (pfd.revents & (POLLERR | POLLHUP | POLLNVAL)) {
        fprintf(stderr, "poll returned error events: 0x%x\n", pfd.revents);
        return -1;
    }

    return 0;
}

static double timespec_difference(const struct timespec *start,
                                  const struct timespec *end)
{
    return (double)(end->tv_sec - start->tv_sec) +
           (double)(end->tv_nsec - start->tv_nsec) / 1000000000.0;
}

static size_t total_bytesused(const struct v4l2_buffer *buf)
{
    size_t total = 0;

    /* 多 Plane 时一帧有效字节数是各 Plane bytesused 之和。 */
    for (unsigned int plane = 0; plane < buf->length; ++plane)
        total += buf->m.planes[plane].bytesused;

    return total;
}

static void update_stats(struct capture_stats *stats,
                         const struct v4l2_buffer *buf,
                         size_t bytesused,
                         const struct timespec *now)
{
    if (stats->frame_count == 0) {
        stats->first_frame_time = *now;
        stats->first_sequence = buf->sequence;
        stats->min_bytesused = bytesused;
        stats->max_bytesused = bytesused;
    } else {
        /*
         * 正常情况下当前 sequence 应等于上一帧 + 1。
         * 差值大于 1 时，把中间缺少的序号数量累计为 sequence_gaps。
         */
        if (buf->sequence > stats->previous_sequence + 1U)
            stats->sequence_gaps +=
                buf->sequence - stats->previous_sequence - 1U;
        else if (buf->sequence <= stats->previous_sequence)
            ++stats->sequence_gaps;

        if (bytesused < stats->min_bytesused)
            stats->min_bytesused = bytesused;
        if (bytesused > stats->max_bytesused)
            stats->max_bytesused = bytesused;
    }

    stats->last_frame_time = *now;
    stats->last_sequence = buf->sequence;
    stats->previous_sequence = buf->sequence;
    stats->have_previous_sequence = true;
    ++stats->frame_count;
}

static int capture_frames(const struct capture_context *ctx,
                          struct capture_stats *stats)
{
    unsigned int consecutive_timeouts = 0;

    while (stats->frame_count < CAPTURE_FRAME_COUNT) {
        struct v4l2_buffer buf;
        struct v4l2_plane planes[VIDEO_MAX_PLANES];
        struct timespec now;
        size_t bytesused;
        int wait_result;

        wait_result = wait_until_frame_ready(ctx->fd);
        if (wait_result == -1)
            return -1;
        if (wait_result == 1) {
            ++stats->poll_timeouts;
            ++consecutive_timeouts;
            fprintf(stderr, "poll timeout %u/%u after %d ms\n",
                    consecutive_timeouts,
                    MAX_CONSECUTIVE_TIMEOUTS,
                    FRAME_TIMEOUT_MS);
            if (consecutive_timeouts >= MAX_CONSECUTIVE_TIMEOUTS)
                return -1;
            continue;
        }

        memset(&buf, 0, sizeof(buf));
        memset(planes, 0, sizeof(planes));
        buf.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        buf.memory = V4L2_MEMORY_MMAP;
        buf.length = VIDEO_MAX_PLANES;
        buf.m.planes = planes;

        /*
         * O_NONBLOCK 下 DQBUF 仍可能返回 EAGAIN：表示此刻没有 DONE Buffer，
         * 回到 poll 重试即可，不能把它误判为 Camera 断流。
         */
        if (xioctl(ctx->fd, VIDIOC_DQBUF, &buf) == -1) {
            if (errno == EAGAIN)
                continue;
            perror("VIDIOC_DQBUF");
            return -1;
        }

        consecutive_timeouts = 0;

        if (buf.index >= ctx->buffer_count) {
            fprintf(stderr, "driver returned invalid buffer index %u\n", buf.index);
            return -1;
        }
        if (buf.length == 0 ||
            buf.length > ctx->buffers[buf.index].num_planes) {
            fprintf(stderr, "driver returned invalid plane count %u\n", buf.length);
            return -1;
        }

        bytesused = total_bytesused(&buf);
        if (clock_gettime(CLOCK_MONOTONIC, &now) == -1) {
            perror("clock_gettime");
            return -1;
        }

        printf("frame[%03u] index=%u sequence=%u timestamp=%ld.%06ld "
               "bytesused=%zu flags=0x%08x\n",
               stats->frame_count,
               buf.index,
               buf.sequence,
               (long)buf.timestamp.tv_sec,
               (long)buf.timestamp.tv_usec,
               bytesused,
               buf.flags);

        update_stats(stats, &buf, bytesused, &now);

        /* 应用已处理完该帧，立即把同一个 Buffer 归还驱动循环复用。 */
        if (queue_one_buffer(ctx, buf.index) == -1)
            return -1;
    }

    return 0;
}

static void print_summary(const struct capture_stats *stats)
{
    double elapsed = timespec_difference(&stats->first_frame_time,
                                         &stats->last_frame_time);
    double fps = 0.0;

    /* 100 个采样点之间只有 99 个时间间隔，因此使用 frame_count - 1。 */
    if (stats->frame_count > 1 && elapsed > 0.0)
        fps = (double)(stats->frame_count - 1U) / elapsed;

    printf("\n=== capture summary ===\n");
    printf("captured frames  : %u\n", stats->frame_count);
    printf("elapsed seconds  : %.6f\n", elapsed);
    printf("actual fps       : %.3f\n", fps);
    printf("first sequence   : %u\n", stats->first_sequence);
    printf("last sequence    : %u\n", stats->last_sequence);
    printf("sequence gaps    : %u\n", stats->sequence_gaps);
    printf("poll timeouts    : %u\n", stats->poll_timeouts);
    printf("bytesused min    : %zu\n", stats->min_bytesused);
    printf("bytesused max    : %zu\n", stats->max_bytesused);
}

/*
 * 统一收尾，按初始化的反方向释放：
 *   STREAMOFF -> munmap -> REQBUFS(0) -> free -> close
 *
 * 返回 -1 表示清理过程中也出现了错误，但函数仍会继续尝试释放后续资源。
 */
static int cleanup_capture(struct capture_context *ctx)
{
    int status = 0;

    if (ctx->fd >= 0 && ctx->streaming) {
        enum v4l2_buf_type type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;

        if (xioctl(ctx->fd, VIDIOC_STREAMOFF, &type) == -1) {
            perror("VIDIOC_STREAMOFF");
            status = -1;
        } else {
            printf("stream status    : OFF\n");
        }
        ctx->streaming = false;
    }

    if (ctx->buffers) {
        for (unsigned int index = 0; index < ctx->buffer_count; ++index) {
            for (unsigned int plane = 0;
                 plane < ctx->buffers[index].num_planes;
                 ++plane) {
                if (!ctx->buffers[index].start[plane])
                    continue;

                if (munmap(ctx->buffers[index].start[plane],
                           ctx->buffers[index].length[plane]) == -1) {
                    perror("munmap");
                    status = -1;
                }
                ctx->buffers[index].start[plane] = NULL;
            }
        }
    }

    if (ctx->fd >= 0 && ctx->queue_allocated) {
        struct v4l2_requestbuffers req;

        memset(&req, 0, sizeof(req));
        req.count = 0;
        req.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        req.memory = V4L2_MEMORY_MMAP;

        /* REQBUFS(count=0) 释放的是驱动/VB2 侧 Buffer 队列。 */
        if (xioctl(ctx->fd, VIDIOC_REQBUFS, &req) == -1) {
            perror("VIDIOC_REQBUFS(count=0)");
            status = -1;
        }
        ctx->queue_allocated = false;
    }

    free(ctx->buffers);
    ctx->buffers = NULL;

    if (ctx->fd >= 0) {
        if (close(ctx->fd) == -1) {
            perror("close");
            status = -1;
        }
        ctx->fd = -1;
    }

    return status;
}

int main(int argc, char **argv)
{
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    struct capture_context ctx;
    struct capture_stats stats;
    int status = EXIT_FAILURE;

    memset(&ctx, 0, sizeof(ctx));
    memset(&stats, 0, sizeof(stats));
    ctx.fd = -1;

    /*
     * O_NONBLOCK 避免异常链路让 DQBUF 永久阻塞；程序用 poll 的 2 秒超时
     * 明确控制等待时间。open 成功只证明节点可打开，不证明能够出帧。
     */
    ctx.fd = open(device, O_RDWR | O_NONBLOCK);
    if (ctx.fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        goto cleanup;
    }

    printf("device           : %s\n", device);

    if (set_format(ctx.fd) == -1)
        goto cleanup;
    if (request_buffers(&ctx) == -1)
        goto cleanup;
    if (map_buffers(&ctx) == -1)
        goto cleanup;
    if (queue_all_buffers(&ctx) == -1)
        goto cleanup;
    if (start_streaming(&ctx) == -1)
        goto cleanup;
    if (capture_frames(&ctx, &stats) == -1)
        goto cleanup;

    print_summary(&stats);
    status = EXIT_SUCCESS;

cleanup:
    /* 成功和失败都必须走同一个出口，保证第二次运行不会被残留状态影响。 */
    if (cleanup_capture(&ctx) == -1)
        status = EXIT_FAILURE;

    return status;
}
