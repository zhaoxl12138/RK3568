# 01-从零到Python MVP学习路线

这份文档按“我从头开始学”的顺序写。

使用方法：

1. 先看本阶段指定 PDF。
2. 只看列出的章节或关键词，不追求整本读完。
3. 再跑命令或脚本。
4. 看到现象后，回到本阶段补概念。
5. 最后把结果同步到对应专项笔记和实验产物索引。

当前状态：

```text
Python MVP 已经跑通。
现在要做的是从阶段 0 重新复盘，把每一步背后的原理补齐。
```

已跑通链路：

```text
IMX415 MIPI Camera
-> RKISP / V4L2
-> GStreamer
-> OpenCV
-> YOLOv5 RKNN / NPU
-> MIPI屏显示
-> RTMP/HLS
-> Windows ffplay 拉流
```

当前先接受一个现实：

```text
最终项目目标可以是 YOLOv8n。
但当前出厂 Buildroot 4.19 系统上，已经跑通的是官方 YOLOv5 RKNN Python MVP。
先用 YOLOv5 建立系统闭环，再升级 YOLOv8n 或 C++。
```

## 阶段0：先建立系统地图

目标：

```text
我到底在做一个什么系统，不要把它理解成“跑一个 AI demo”。
```

本阶段只做一件事：先记住整条链路。

```text
IMX415 MIPI Camera
 ↓
RK3568 MIPI CSI
 ↓
RKISP
 ↓
V4L2 /dev/video0
 ↓
GStreamer
 ↓
OpenCV Mat
 ↓
YOLOv5 RKNN / NPU
 ↓
画框
 ↓
MIPI屏显示 + HLS拉流
```

这张图先回答三个问题：

- Camera 数据从哪里进来。
- AI 推理在哪里发生。
- 结果从哪里显示和输出。

本阶段必读：

- [[00-AI视觉系统主线|01-主线 / AI视觉系统主线]]

读法：扫一遍即可，不需要做笔记。

完成标准：

```text
能用自己的话说出：
Camera 通过 MIPI CSI 进入 RK3568，经过 RKISP 变成 /dev/video0；
GStreamer 把 Camera 帧转成 OpenCV 能处理的 BGR；
OpenCV 把图像送给 RKNN 跑 YOLOv5；
结果显示到 MIPI 屏，同时通过 HLS 给 Windows 拉流。
```

## 阶段1：板子开机和 Buildroot 验机

要解决的问题：

```text
确认板子、系统、屏幕、网络、Camera 硬件链路都正常。
```

先看本地 PDF：

- [Buildroot系统快速体验手册V1.3](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/01、测试文档/01【正点原子】ATK-DLRK3568_Buildroot系统快速体验手册V1.3.pdf>)

重点看：

- 串口登录
- 系统信息查看
- 网络测试
- SSH 登录
- Camera 测试
- WiFi 天线和无线连接

暂时不用看：

- 每个外设都完整测试
- Android 体验
- Qt 应用细节
- OpenHarmony

外部补充：

- [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html)

本阶段要掌握的概念：

- Buildroot 是一个生成嵌入式 Linux 系统的工具，不是 Ubuntu/Debian 那种通用发行版。
- 正点原子出厂系统是一个裁剪过的嵌入式 Linux，适合做板级验证和部署。
- 串口是救命通道，SSH 是日常开发通道。

已验证事实：

```text
系统：Buildroot 2018.02-rc3
内核：Linux 4.19 系列
用户：root
板端固定连接 IP：192.168.0.230
Camera 屏幕应用：可以正常出图
```

跟跑命令：

```bash
uname -a
cat /etc/os-release
whoami
pwd
ip addr
df -h
free -h
```

成功现象：

- 串口能看到 root shell。
- SSH 能登录 `root@192.168.0.230`。
- MIPI 屏上的 Camera 应用能看到实时画面。

常见坑：

- UART 和 OTG 不是一回事。串口登录接 UART，不是接 OTG。
- 串口乱码通常是波特率不对，当前使用 `115200 8N1`。
- `/dev/video0` 被屏幕 Camera 应用占用时，命令行抓帧会报 `Device or resource busy`。

记录到：

- [[板子到手验机记录]]
- [[每日进度记录]]

## 阶段2：认识 Camera、V4L2 和 /dev/video0

要解决的问题：

```text
Linux 里 Camera 到底以什么形式暴露给应用层。
```

先预读概念：

- [[00-概念索引|07-专项笔记 / 概念索引]]

只看：

- `MIPI Camera`
- `RKISP`
- `V4L2`
- `Media Controller`
- `NV12`

为什么放在这里：

```text
这些概念都是理解 Camera 到 /dev/video0 之前必须先有印象的词。
阶段0只建立系统地图，不展开这些细节。
```

先看本地 PDF：

- [基于Buildroot系统Camera应用开发手册V1.1](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/30【正点原子】基于Buildroot系统Camera应用开发手册V1.1.pdf>)

重点看：

- Camera 示例程序如何打开设备。
- 示例里是否出现 `/dev/video*`。
- 示例里是否出现 OpenCV、V4L2、GStreamer。

这份 PDF 的定位：

```text
它不是系统性的 Camera 原理教程。
它更像官方应用例程索引，只用来对齐板子上有什么示例。
```

外部补充：

- [Linux V4L2 用户空间 API](https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html)
- [Linux Media Controller API](https://www.kernel.org/doc/html/latest/userspace-api/media/mediactl/media-controller.html)

本阶段要掌握的概念：

- V4L2 是 Linux 用户态访问 Camera/Video 设备的标准接口。
- `/dev/video0` 是一个视频采集节点，不等于 Camera sensor 本身。
- RK3568 的 Camera 链路大致是 `IMX415 -> MIPI CSI -> RKISP -> /dev/video0`。
- `rkisp_mainpath` 是主采集通道，当前对应 `/dev/video0` 和 `/dev/video-camera0`。
- `NV12` 是一种 YUV 4:2:0 图像格式。

已验证事实：

```text
/dev/video0          rkisp_mainpath
/dev/video-camera0  rkisp_mainpath
/dev/video1          rkisp_selfpath
/dev/video7          rkisp-statistics
/dev/video8          rkisp-input-params
/dev/media0          media controller 拓扑入口
```

跟跑命令：

```bash
v4l2-ctl --list-devices
v4l2-ctl -d /dev/video0 --all
v4l2-ctl -d /dev/video0 --list-formats-ext
```

成功现象：

- 能看到 `rkisp_mainpath`。
- 能看到默认格式 `1280x720 NV12`。
- 能看到支持范围到 `3840x2160`。

常见坑：

- `/dev/video0` 忙时，不要怀疑驱动，先关掉屏幕相机软件或旧 demo。
- `v4l2-ctl --all` 看到的是设备当前状态，不代表你的应用已经能正确读取。
- Media 节点和 Video 节点要一起理解，前者描述拓扑，后者负责数据流。

记录到：

- [[V4L2命令行抓帧记录]]
- [[00-概念索引]]

## 阶段3：用 v4l2-ctl 抓一帧 NV12

要解决的问题：

```text
证明 Camera 可以绕过屏幕应用，直接从命令行采集原始帧。
```

先回看：

- [[V4L2命令行抓帧记录]]

外部补充：

- [Linux V4L2 streaming I/O](https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/mmap.html)
- [FFmpeg rawvideo 输入说明](https://ffmpeg.org/ffmpeg-formats.html#rawvideo)

本阶段要掌握的概念：

- 原始 YUV 文件没有文件头，播放器不知道宽高和格式。
- NV12 单帧大小约等于 `width * height * 1.5`。
- `1280x720 NV12` 单帧大小是 `1280 * 720 * 1.5 = 1382400` 字节。
- `--stream-mmap` 表示使用内存映射方式从驱动取帧。

跟跑命令：

```bash
v4l2-ctl -d /dev/video0 \
  --set-fmt-video=width=1280,height=720,pixelformat=NV12 \
  --stream-mmap=3 \
  --stream-count=1 \
  --stream-to=/tmp/frame_1280x720_nv12.yuv

ls -lh /tmp/frame_1280x720_nv12.yuv
```

Windows 查看：

```powershell
ffplay -f rawvideo -pixel_format nv12 -video_size 1280x720 E:\RK3568\frame_1280x720_nv12.yuv
```

成功现象：

- 板端生成约 `1.4M` 的 `.yuv` 文件。
- Windows `ffplay` 能看到真实 Camera 画面。

常见坑：

- 0 字节文件基本意味着采集失败。
- `Device or resource busy` 说明设备被占用。
- Windows 拉文件用 `scp` 更稳，不要依赖 MobaXterm 文件面板卡住。

记录到：

- [[V4L2命令行抓帧记录]]
- [[附录-实验产物索引]]

## 阶段4：OpenCV 读取 Camera

要解决的问题：

```text
把 Camera 帧从 Linux 采集节点送进 OpenCV，变成可处理的 BGR 图像。
```

先看本地 PDF：

- [OpenCV4使用手册V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/19【正点原子】ATK-DLRK3568_OpenCV4使用手册V1.0.pdf>)

重点看：

- 板端是否内置 OpenCV。
- Python 是否能 `import cv2`。
- OpenCV 示例如何读取图像、保存图像。

暂时不用看：

- OpenCV GUI 深入。
- 图像算法细节。
- Qt + OpenCV 示例。

外部补充：

- [OpenCV VideoCapture](https://docs.opencv.org/4.x/d8/dfe/classcv_1_1VideoCapture.html)
- [OpenCV color conversion](https://docs.opencv.org/4.x/d8/d01/group__imgproc__color__conversions.html)
- [GStreamer v4l2src](https://gstreamer.freedesktop.org/documentation/video4linux2/v4l2src.html)
- [GStreamer appsink](https://gstreamer.freedesktop.org/documentation/app/appsink.html)

本阶段要掌握的概念：

- OpenCV 处理图像时常用 BGR，不是 RGB。
- 当前板端 `cv2.VideoCapture(0)` 已验证失败，不作为主路线。
- 失败原因不是“OpenCV 不能用”，而是 OpenCV 默认打开方式不适配当前 RKISP V4L2 multiplanar 节点。
- 成功路线是显式 GStreamer pipeline。

当前成功 pipeline：

```text
v4l2src device=/dev/video0
! video/x-raw,format=NV12,width=1280,height=720
! videoconvert
! video/x-raw,format=BGR
! appsink drop=1 sync=false
```

验证脚本：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\opencv_camera\opencv_capture_gst.py
```

成功现象：

- 板端生成 `/tmp/opencv_frame_gst.jpg`。
- Windows 取回后能看到正常 JPEG。
- 说明链路已到 `Camera -> GStreamer -> OpenCV Mat`。

记录到：

- [[OpenCV读取Camera记录]]
- [[附录-实验产物索引]]

## 阶段5：跑通官方最小 RKNN 例程

要解决的问题：

```text
确认板端 RKNN runtime、rknn_server、rknn-toolkit-lite2 和 NPU 推理链路可用。
```

先看本地 PDF：

- [AI例程测试手册V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/01、测试文档/03【正点原子】ATK-DLRK3568_AI例程测试手册V1.0.pdf>)

重点看：

- 第 2 章：更新板端 RKNN 运行库。
- 第 5.1 节：安装 RKNN Toolkit Lite2。
- 第 5.3 节：运行 `01_lenet`。

暂时不用看：

- 模型转换。
- 量化。
- YOLO 大例程。
- Linux5.10 AI 文档。

外部补充：

- [Rockchip RKNN Toolkit2](https://github.com/airockchip/rknn-toolkit2)

本阶段要掌握的概念：

- `.rknn` 是 Rockchip NPU 可运行的模型格式。
- `rknn-toolkit-lite2` 是板端 Python 推理接口。
- `librknnrt.so` 是板端 RKNN runtime。
- `rknn_server` 是板端服务组件。
- 先跑 `01_lenet` 是为了验证基础环境，不是为了学 LeNet。

已验证事实：

```text
rknn-toolkit-lite2：1.5.0
rknn_server：1.5.0
librknnrt.so：1.5.0
NPU driver：0.8.2
01_lenet 输出：[5]: 1.0
```

成功现象：

```text
Python -> rknnlite -> .rknn模型 -> RKNN runtime -> NPU -> 推理结果
```

记录到：

- [[官方AI例程运行记录]]
- [[附录-实验产物索引]]

## 阶段6：Camera + RKNN 汇合

要解决的问题：

```text
把 OpenCV 读到的 Camera 帧送进 RKNN 模型，并画出检测结果。
```

先回看：

- [[Camera-OpenCV-RKNN汇合路线]]
- [[官方AI例程运行记录]]

继续看本地 PDF：

- [AI例程测试手册V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/01、测试文档/03【正点原子】ATK-DLRK3568_AI例程测试手册V1.0.pdf>)

重点看：

- 第 6 章中的 Camera AI 例程。
- `11_facedet_scrfd_npu` 的运行方式。
- `06_yolov5` 的模型、anchors、labels。

暂时不用看：

- Linux5.10 的 YOLOv8 例程。
- 自己转换 YOLOv8n。
- RKNN 量化参数。

本阶段要掌握的概念：

- AI 推理不是只有模型文件，还包括前处理和后处理。
- 前处理负责 resize、颜色格式、归一化、输入 shape。
- 后处理负责解析输出、阈值过滤、NMS、画框。
- 官方实时 Camera AI 例程默认用 `cv2.VideoCapture(0)`，当前板端要改成 GStreamer pipeline。

当前已经跑通的两个汇合点：

```text
Camera -> GStreamer -> OpenCV -> SCRFD RKNN -> 人脸框 -> JPG/MIPI
Camera -> GStreamer -> OpenCV -> YOLOv5 RKNN -> 检测框 -> JPG/MIPI
```

为什么先用 SCRFD：

```text
SCRFD 模型小，源码短，适合验证 Camera 帧进入 RKNN 的实时链路。
```

为什么又切到 YOLOv5：

```text
最终项目需要目标检测。
当前 4.19 资料包内官方可用目标检测模型是 YOLOv5 RKNN。
所以先用 YOLOv5 建立目标检测 MVP。
```

记录到：

- [[SCRFD源码拆解与复用点]]
- [[YOLOv5 Python最小推理记录]]
- [[附录-实验产物索引]]

## 阶段7：MIPI 屏本地显示

要解决的问题：

```text
让板子本地屏幕直接显示 AI 检测结果，不只在 Windows 上看文件。
```

先看：

- [[MIPI屏显示链路]]

本地 PDF：

- [基于Buildroot系统MIPI屏幕横屏显示设置V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/23【正点原子】基于Buildroot系统MIPI屏幕横屏显示设置V1.0.pdf>)
- [三屏显示参考手册V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/07【正点原子】ATK-DLRK3568三屏显示参考手册V1.0.pdf>)

重点看：

- 屏幕方向。
- 分辨率。
- 显示环境。

暂时不用看：

- Qt UI 开发。
- 多屏复杂配置。
- 横屏应用移植。

本阶段要掌握的概念：

- MIPI 屏是板端显示设备，和 Camera 的 MIPI CSI 不是同一个方向。
- Camera MIPI 是输入，LCD MIPI 是输出。
- 当前 Python MVP 用 OpenCV 窗口显示检测结果。
- MIPI 显示方向和 Windows HLS 观看方向必须拆开处理。

当前固定命令：

```bash
cd /userdata/aidemo/06_yolov5_python
SHOW_MIPI=1 FRAMES=0 ./start_yolov5_hls_demo.sh
```

当前默认方向：

```text
ROTATE=none
DISPLAY_ROTATE=ccw
STREAM_ROTATE=ccw
```

关键结论：

```text
SHOW_MIPI 控制板端屏幕显示。
DISPLAY_ROTATE 只影响 MIPI。
STREAM_ROTATE 只影响 Windows HLS。
不要再用 DISPLAY=1 作为主写法。
```

记录到：

- [[MIPI屏显示链路]]
- [[Python MVP演示手册]]

## 阶段8：RTMP/HLS 推流和 Windows 拉流

要解决的问题：

```text
把带检测框的视频从板子输出到 Windows 播放器。
```

先看本地 PDF：

- [RTMP推流V1.1](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/18【正点原子】ATK-DLRK3568_RTMP推流V1.1.pdf>)

重点看：

- Nginx RTMP 的角色。
- FFmpeg 推流命令。
- 客户端拉流验证方式。

暂时不用看：

- 推流性能优化。
- RTSP。
- 硬件编码。
- 多路视频。

外部补充：

- [FFmpeg Documentation](https://ffmpeg.org/ffmpeg.html)
- [FFmpeg HLS muxer](https://ffmpeg.org/ffmpeg-formats.html#hls-2)
- [nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module)

本阶段要掌握的概念：

- RTMP 更像板端推给 Nginx 的入口协议。
- HLS 是 Windows 浏览器或播放器更容易拉取的 HTTP 分片输出。
- `.m3u8` 是播放列表，`.ts` 是视频分片。
- HLS 需要关键帧边界，所以编码端需要固定 GOP。

当前固定运行：

```bash
cd /userdata/aidemo/06_yolov5_python
SHOW_MIPI=1 FRAMES=0 ./start_yolov5_hls_demo.sh
```

Windows 拉流：

```powershell
ffplay http://192.168.0.230/hls/yolo.m3u8
```

常见坑：

- 这条 `ffplay` 要在 Windows 执行，不是在板子 SSH 里执行。
- 板子 SSH 里执行 `ffplay` 报 `No available video device`，不是 HLS 失败。
- `404 Not Found` 通常是程序没跑起来、HLS 还没生成、或者摄像头被占用。
- 短测试至少跑 60 帧，HLS 需要时间生成 `.m3u8`。

记录到：

- [[RTMP-HLS推流记录]]
- [[附录-实验产物索引]]

## 阶段9：复现 Python MVP

要解决的问题：

```text
不靠临时命令，按固定文档独立复现完整闭环。
```

先看：

- [[Python MVP演示手册]]
- [[YOLOv5 Python最小推理记录]]
- [[RTMP-HLS推流记录]]
- [[MIPI屏显示链路]]

部署：

```bash
cd /home/rk3568/work/rk3568_ai_camera
./scripts/deploy_yolov5_demo.sh
```

板端启动：

```bash
cd /userdata/aidemo/06_yolov5_python
SHOW_MIPI=1 FRAMES=0 ./start_yolov5_hls_demo.sh
```

Windows 拉流：

```powershell
ffplay http://192.168.0.230/hls/yolo.m3u8
```

完成标准：

- MIPI 屏显示实时检测框。
- Windows 能拉到 HLS 视频。
- 画面方向正确。
- 画面比例不明显拉伸。
- 程序输出 FPS。

当前已验证结果：

```text
YOLOv5 + MIPI：约 3.8 - 4.1 FPS
YOLOv5 + RTMP/HLS：约 4.9 - 5.0 FPS
```

记录到：

- [[Python MVP演示手册]]
- [[每日进度记录]]
- [[附录-实验产物索引]]

## 阶段10：后续 C++ 工程化升级

当前先不做。

后面要解决的问题：

```text
把 Python MVP 升级成更像真实项目的 C++17/CMake 工程。
```

后续再看本地 PDF：

- [交叉编译器安装与使用参考手册V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/33【正点原子】基于Buildroot系统_交叉编译器安装与使用参考手册V1.0.pdf>)
- [Ubuntu环境搭建&VSCode安装使用V1.0](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/15【正点原子】Ubuntu环境搭建&VSCode安装使用V1.0.pdf>)

后续模块：

- CameraSource
- Detector
- DisplaySink
- StreamSink
- AppPipeline

当前原则：

```text
Python 用来快速验证系统链路。
C++ 用来做后续工程化、性能和项目展示升级。
```

## 当前学习位置

你现在应该从阶段 0 开始复盘。

但实际功能已经跑到阶段 9。

当前任务不是继续扩功能，而是：

```text
按阶段 0 到阶段 9，把每一步背后的概念补齐。
```

下一步打开：

- [[00-当前阅读位置和下一步文档]]
- [[01-官方PDF与外部链接索引]]
- [[00-概念索引]]

#主线 #从零学习 #PythonMVP #Camera #V4L2 #OpenCV #RKNN #HLS
