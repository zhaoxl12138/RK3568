/*
 * Day 1：查询 V4L2 Video Node 的能力、可选格式和当前格式。
 *
 * 本程序只回答三个问题：
 *   1. /dev/video0 是什么类型的节点？             VIDIOC_QUERYCAP
 *   2. 这个节点允许应用请求哪些像素格式？          VIDIOC_ENUM_FMT
 *   3. 这个节点当前实际使用什么格式？              VIDIOC_G_FMT
 *
 * 它不会设置格式、申请 Buffer 或启动 Camera 数据流。
 */

/* errno / EINTR：读取系统调用失败原因，并判断是否被信号中断。 */
#include <errno.h>
/* open()、O_RDWR。 */
#include <fcntl.h>
/* V4L2 用户态标准头文件：结构体、能力位、VIDIOC_* ioctl 命令。 */
#include <linux/videodev2.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

static int xioctl(int fd, unsigned long request, void *arg)
{
    int ret;

    /*
     * xioctl() 不是 V4L2 提供的函数，而是本程序对 Linux ioctl() 的薄封装。
     *
     * fd      ：open("/dev/video0") 返回的文件描述符，决定“操作哪个节点”。
     * request ：VIDIOC_QUERYCAP / ENUM_FMT / G_FMT，决定“要求驱动做什么”。
     * arg     ：用户态结构体地址，应用和驱动通过这块内存双向交换数据。
     *
     * ioctl 可能被信号临时打断并返回 EINTR。这不代表 Camera 故障，重试即可；
     * 其他错误保留 errno，由外层函数打印具体是哪一个 VIDIOC_* 失败。
     */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static void fourcc_to_string(__u32 fourcc, char text[5])
{
    /*
     * FourCC（Four Character Code）在内核接口中以 32 位整数保存。
     * 例如 V4L2_PIX_FMT_NV12 的四个低字节依次是 'N'、'V'、'1'、'2'。
     * 这里用按位与和右移依次取出四个字节，便于 printf 显示。
     */
    text[0] = (char)(fourcc & 0xff);
    text[1] = (char)((fourcc >> 8) & 0xff);
    text[2] = (char)((fourcc >> 16) & 0xff);
    text[3] = (char)((fourcc >> 24) & 0xff);
    text[4] = '\0';
}

static void print_capability_flags(__u32 caps)
{
    /*
     * caps 是“能力位集合”。按位与不是比较整个数值，而是在检查某一位是否置 1。
     * V4L2_CAP_VIDEO_CAPTURE_MPLANE：使用多平面版本的 Capture API。
     * V4L2_CAP_STREAMING：支持 REQBUFS/QBUF/STREAMON 这套流式采集方式。
     */
    printf("capture type : %s\n",
           (caps & V4L2_CAP_VIDEO_CAPTURE_MPLANE)
               ? "Video Capture Multiplanar"
               : "not Video Capture Multiplanar");
    printf("streaming    : %s\n",
           (caps & V4L2_CAP_STREAMING) ? "yes" : "no");
}

static void query_capabilities(int fd, enum v4l2_buf_type *type)
{
    /* 驱动通过 QUERYCAP 向应用返回节点身份和能力。它不是 Sensor ID 结构体。 */
    struct v4l2_capability cap;
    __u32 effective_caps;

    /*
     * V4L2 UAPI 结构体通常要求未使用字段为 0。
     * memset 清零可避免栈上的随机值被驱动误认为有效参数。
     */
    memset(&cap, 0, sizeof(cap));

    /*
     * 调用前：cap 只是一块已清零的用户内存。
     * 调用后：rkisp_v5 驱动把 driver/card/bus_info/capabilities 写入 cap。
     */
    if (xioctl(fd, VIDIOC_QUERYCAP, &cap) == -1) {
        perror("VIDIOC_QUERYCAP");
        exit(EXIT_FAILURE);
    }

    /*
     * capabilities 可能包含整个物理设备的综合能力。
     * 当 V4L2_CAP_DEVICE_CAPS 置位时，device_caps 才表示当前 /dev/video0
     * 这个具体 Video Node 的能力，因此后续判断使用 effective_caps。
     */
    effective_caps = (cap.capabilities & V4L2_CAP_DEVICE_CAPS)
                         ? cap.device_caps
                         : cap.capabilities;

    printf("=== VIDIOC_QUERYCAP ===\n");
    printf("driver       : %s\n", cap.driver);
    printf("card         : %s\n", cap.card);
    printf("bus          : %s\n", cap.bus_info);
    printf("capabilities : 0x%08x\n", cap.capabilities);
    printf("device_caps  : 0x%08x\n", effective_caps);
    print_capability_flags(effective_caps);

    if (effective_caps & V4L2_CAP_VIDEO_CAPTURE_MPLANE) {
        /*
         * type 是调用者传进来的指针；*type 表示修改 main() 中的 type 变量。
         * 后续 ENUM_FMT 和 G_FMT 必须使用与节点一致的 Buffer Type。
         */
        *type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
        return;
    }

    fprintf(stderr, "This exercise requires a multiplanar capture node.\n");
    exit(EXIT_FAILURE);
}

static void enumerate_formats(int fd, enum v4l2_buf_type type)
{
    /* 每调用一次 VIDIOC_ENUM_FMT，驱动根据 desc.index 返回一个候选格式。 */
    struct v4l2_fmtdesc desc;

    printf("\n=== VIDIOC_ENUM_FMT ===\n");
    for (__u32 index = 0;; ++index) {
        char fourcc[5];

        /* desc 每轮都重新清零，只填写应用必须提供的 index 和 type。 */
        memset(&desc, 0, sizeof(desc));
        desc.index = index;
        desc.type = type;

        /*
         * 调用前：应用请求“第 index 个、MPLANE Capture 类型的格式”。
         * 调用后：驱动回填 pixelformat、description、flags 等字段。
         */
        if (xioctl(fd, VIDIOC_ENUM_FMT, &desc) == -1) {
            if (errno == EINVAL)
                break; /* EINVAL 表示枚举已经结束，不是故障。 */
            perror("VIDIOC_ENUM_FMT");
            exit(EXIT_FAILURE);
        }

        /* pixelformat 是整数形式 FourCC，转换为 NV12/UYVY 等可读文本。 */
        fourcc_to_string(desc.pixelformat, fourcc);
        printf("[%02u] %-4s  %s\n", index, fourcc, desc.description);
    }
}

static void get_current_format(int fd, enum v4l2_buf_type type)
{
    /* fmt 是通用格式容器；内部 union 根据 fmt.type 选择不同成员。 */
    struct v4l2_format fmt;
    /* pix 只是一个局部指针别名，指向 fmt 内部的 pix_mp，不复制结构体。 */
    struct v4l2_pix_format_mplane *pix;
    char fourcc[5];

    memset(&fmt, 0, sizeof(fmt));
    /* 告诉驱动，本次查询的是 Multiplanar Capture 格式。 */
    fmt.type = type;

    /* G_FMT 中的 G 是 Get：驱动把当前生效格式回填到 fmt。 */
    if (xioctl(fd, VIDIOC_G_FMT, &fmt) == -1) {
        perror("VIDIOC_G_FMT");
        exit(EXIT_FAILURE);
    }

    /*
     * 因为 type 是 VIDEO_CAPTURE_MPLANE，所以应读取 union 中的 pix_mp 成员，
     * 不能读取单平面接口使用的 fmt.fmt.pix。
     */
    pix = &fmt.fmt.pix_mp;
    fourcc_to_string(pix->pixelformat, fourcc);

    printf("\n=== VIDIOC_G_FMT ===\n");
    printf("current fmt  : %s %ux%u, planes=%u\n",
           fourcc, pix->width, pix->height, pix->num_planes);

    for (__u8 plane = 0; plane < pix->num_planes; ++plane) {
        /*
         * num_planes 是驱动返回的“独立内存 Plane 数”。
         * 本板 NV12 返回 1，因此只读取 plane_fmt[0]；不能因 NV12 有 Y/UV
         * 两个内容区域就擅自循环两次。
         */
        printf("plane[%u]     : bytesperline=%u, sizeimage=%u\n",
               plane,
               pix->plane_fmt[plane].bytesperline,
               pix->plane_fmt[plane].sizeimage);
    }
}

int main(int argc, char **argv)
{
    /*
     * argc/argv 是命令行参数：
     *   ./query_device /dev/video1  -> 使用用户指定节点
     *   ./query_device              -> 默认使用 /dev/video0
     */
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    /* query_capabilities() 会通过指针给它赋值。 */
    enum v4l2_buf_type type;
    /* fd 是当前进程访问 /dev/video0 的句柄，后续每个 ioctl 都带着它。 */
    int fd;

    /* O_RDWR 是很多 V4L2 streaming 驱动的常用打开方式，即使本日只查询。 */
    fd = open(device, O_RDWR);
    if (fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        return EXIT_FAILURE;
    }

    printf("device       : %s\n", device);

    /*
     * 三个阶段都是查询，不会设置格式、申请 Buffer 或启动数据流：
     *   1. 节点是谁、有什么能力；
     *   2. 驱动允许应用请求哪些候选 FourCC；
     *   3. 当前实际生效的格式是什么。
     */
    query_capabilities(fd, &type);
    enumerate_formats(fd, type);
    get_current_format(fd, type);

    /* 释放当前进程持有的 Video Node 文件描述符。 */
    if (close(fd) == -1) {
        perror("close");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
