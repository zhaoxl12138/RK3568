/*
 * Day 2：向 /dev/video0 请求 NV12 3840x2160，并读取驱动回填结果。
 *
 * 本程序只执行格式协商：
 *   open -> VIDIOC_QUERYCAP -> VIDIOC_S_FMT -> print -> close
 *
 * 它不会申请 Buffer，也不会 STREAMON。
 */

/* errno / EINTR：读取系统调用失败原因，并判断 ioctl 是否被信号中断。 */
#include <errno.h>
/* open()、O_RDWR。 */
#include <fcntl.h>
/* V4L2 用户态标准接口：v4l2_format、能力位和 VIDIOC_* 命令。 */
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
     * 这是应用自己封装的 ioctl()，不是内核提供的另一个 V4L2 API。
     *
     * fd      ：指出操作哪个 /dev/videoX；
     * request ：指出本次命令，例如 QUERYCAP 或 S_FMT；
     * arg     ：指向用户态结构体，驱动既读取它，也会把结果写回它。
     *
     * EINTR 只表示系统调用被信号临时打断，因此原样重试；其他错误交给
     * 调用者结合具体 VIDIOC_* 名称处理。
     */
    do {
        ret = ioctl(fd, request, arg);
    } while (ret == -1 && errno == EINTR);

    return ret;
}

static void fourcc_to_string(__u32 fourcc, char text[5])
{
    /*
     * 像素格式在 V4L2 中是一个 32 位 FourCC（Four Character Code）。
     * NV12 实际保存成四个字节 'N'、'V'、'1'、'2'；逐字节取出后，
     * printf 才能显示成人能直接阅读的字符串。
     */
    text[0] = (char)(fourcc & 0xff);
    text[1] = (char)((fourcc >> 8) & 0xff);
    text[2] = (char)((fourcc >> 16) & 0xff);
    text[3] = (char)((fourcc >> 24) & 0xff);
    text[4] = '\0';
}

static void require_mplane_capture(int fd)
{
    /* QUERYCAP 用它返回“这个 Video Node 是谁、具有什么能力”。 */
    struct v4l2_capability cap;
    /* 能力由多个二进制位组成，因此用 __u32 位掩码保存。 */
    __u32 caps;

    /* V4L2 UAPI 结构体的保留字段应为 0，先清零最稳妥。 */
    memset(&cap, 0, sizeof(cap));
    /*
     * 调用前 cap 是空结构体；调用后驱动回填 driver、card、能力位等。
     * 这一步只确认 /dev/video0 的软件接口能力，不证明 Camera 已经出帧。
     */
    if (xioctl(fd, VIDIOC_QUERYCAP, &cap) == -1) {
        perror("VIDIOC_QUERYCAP");
        exit(EXIT_FAILURE);
    }

    /*
     * capabilities 可能描述整个物理设备；当 DEVICE_CAPS 置位时，
     * device_caps 才是当前这个 /dev/videoX 节点的实际能力。
     */
    caps = (cap.capabilities & V4L2_CAP_DEVICE_CAPS)
               ? cap.device_caps
               : cap.capabilities;

    /*
     * 本练习使用 v4l2_pix_format_mplane 和 plane_fmt[]，所以要求节点支持
     * VIDEO_CAPTURE_MPLANE。这里的“多平面 API”不等于 NV12 必定返回两个
     * 独立内存 Plane；本板驱动实际可能返回 num_planes = 1。
     */
    if (!(caps & V4L2_CAP_VIDEO_CAPTURE_MPLANE)) {
        fprintf(stderr, "device does not support multiplanar capture\n");
        exit(EXIT_FAILURE);
    }
}

static void set_nv12_format(int fd)
{
    /*
     * v4l2_format 是通用格式容器。fmt.type 决定内部 union 应解释为
     * 单平面 pix、MPlane pix_mp，还是其他类型。
     */
    struct v4l2_format fmt;
    /* pix 只是指向 fmt.fmt.pix_mp 的局部别名，不会复制一份格式对象。 */
    struct v4l2_pix_format_mplane *pix;
    char returned_fourcc[5];

    /* 清零保留字段；随后只填写应用真正想请求的内容。 */
    memset(&fmt, 0, sizeof(fmt));

    /*
     * 下面五项都是应用提出的“期望值”，不是最终硬件配置：
     * type        ：对 Capture MPlane 队列设置格式；
     * width/height：期望 3840x2160；
     * pixelformat ：期望 NV12；
     * field       ：期望逐行帧，不使用隔行场。
     */
    fmt.type = V4L2_BUF_TYPE_VIDEO_CAPTURE_MPLANE;
    fmt.fmt.pix_mp.width = 3840;
    fmt.fmt.pix_mp.height = 2160;
    fmt.fmt.pix_mp.pixelformat = V4L2_PIX_FMT_NV12;
    fmt.fmt.pix_mp.field = V4L2_FIELD_NONE;

    printf("request fmt  : NV12 3840x2160\n");

    /*
     * S_FMT 中的 S 是 Set，但它不是单向“写命令”：
     *
     *   应用填 fmt ──ioctl──> V4L2 Core / RKISP 驱动
     *   应用读 fmt <─同一结构体── 驱动校验和调整后的结果
     *
     * 例如驱动可以调整尺寸、stride、sizeimage 或 num_planes。返回 0 只说明
     * 格式请求被接受，不代表已经申请 Buffer，更不代表 Sensor 正在出流。
     */
    if (xioctl(fd, VIDIOC_S_FMT, &fmt) == -1) {
        perror("VIDIOC_S_FMT");
        exit(EXIT_FAILURE);
    }

    /* S_FMT 返回后，必须读取驱动回填的结果，不能继续把请求值当成事实。 */
    pix = &fmt.fmt.pix_mp;
    fourcc_to_string(pix->pixelformat, returned_fourcc);

    printf("driver fmt   : %s %ux%u, planes=%u\n",
           returned_fourcc, pix->width, pix->height, pix->num_planes);
    printf("field        : %u\n", pix->field);

    for (__u8 plane = 0; plane < pix->num_planes; ++plane) {
        /*
         * bytesperline：一行图像在内存中占多少字节（可能含对齐填充）。
         * sizeimage   ：该内存 Plane 至少需要多大 Buffer。
         * 循环上限必须用驱动返回的 num_planes，不能凭 NV12 名称猜成 2。
         */
        printf("plane[%u]     : bytesperline=%u, sizeimage=%u\n",
               plane,
               pix->plane_fmt[plane].bytesperline,
               pix->plane_fmt[plane].sizeimage);
    }
}

int main(int argc, char **argv)
{
    /* 允许 ./set_format /dev/video1；未传参数时默认操作 /dev/video0。 */
    const char *device = (argc > 1) ? argv[1] : "/dev/video0";
    /* fd 是当前进程访问该 Video Node 的句柄，后续 ioctl 都通过它定位节点。 */
    int fd;

    /* O_RDWR 是 V4L2 Capture/Streaming 节点最通用的打开方式。 */
    fd = open(device, O_RDWR);
    if (fd == -1) {
        fprintf(stderr, "open %s: %s\n", device, strerror(errno));
        return EXIT_FAILURE;
    }

    /*
     * 本程序严格停在“能力确认 + 格式协商”：
     *   1. 确认此节点支持 MPlane Capture；
     *   2. 请求 NV12，并打印驱动真正接受的格式；
     *   3. 不执行 REQBUFS/QBUF/STREAMON，因此不会产生图像帧。
     */
    require_mplane_capture(fd);
    set_nv12_format(fd);

    /* 关闭 Video Node；进程不再持有这次格式协商使用的文件描述符。 */
    if (close(fd) == -1) {
        perror("close");
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}
