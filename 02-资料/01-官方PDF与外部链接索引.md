# 01-官方PDF与外部链接索引

这份文档只回答一个问题：

```text
每个阶段该看哪份本地 PDF，外部概念用哪些官方资料补。
```

规则：

- 本地 PDF 用来对齐正点原子板子的实际环境。
- 外部官方链接用来补 Linux、多媒体、OpenCV、FFmpeg、RKNN 的通用概念。
- 不把所有资料都放进主线，只保留当前项目需要的入口。

## 第一优先级 PDF

### 1. Buildroot 快速体验

本地 PDF：

- [01【正点原子】ATK-DLRK3568_Buildroot系统快速体验手册V1.3.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/01、测试文档/01【正点原子】ATK-DLRK3568_Buildroot系统快速体验手册V1.3.pdf>)

什么时候看：

- 刚拿到板子。
- 串口、网络、SSH、Camera、屏幕基础功能验证。

当前只看：

- 串口登录。
- 网络和 SSH。
- Camera 出图。
- 系统信息查看。

暂时不看：

- 全部外设逐项测试。
- Android 相关内容。
- Qt 应用体验。

对应学习阶段：

- [[02-从零到Python MVP学习路线]] 的阶段1。

### 2. Camera 应用开发

本地 PDF：

- [30【正点原子】基于Buildroot系统Camera应用开发手册V1.1.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/30【正点原子】基于Buildroot系统Camera应用开发手册V1.1.pdf>)

什么时候看：

- 已经确认屏幕 Camera 能出图后。
- 开始理解 `/dev/video*`、OpenCV 示例、Camera 应用例程时。

当前只看：

- Camera 示例怎么启动。
- 是否用到 `/dev/video*`。
- 是否涉及 V4L2、OpenCV、GStreamer。

这份文档的真实价值：

```text
价值有限，不是完整 Camera 原理教程。
它主要用于知道官方给了哪些 Camera 应用示例。
```

对应学习阶段：

- [[02-从零到Python MVP学习路线]] 的阶段2。

### 3. OpenCV4 使用手册

本地 PDF：

- [19【正点原子】ATK-DLRK3568_OpenCV4使用手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/19【正点原子】ATK-DLRK3568_OpenCV4使用手册V1.0.pdf>)

什么时候看：

- `/dev/video0` 抓帧成功后。
- 准备把 Camera 帧送进 OpenCV 时。

当前只看：

- 板端 OpenCV 是否内置。
- Python `cv2` 是否可用。
- 示例程序如何读取和保存图片。

暂时不看：

- OpenCV 算法细节。
- Qt + OpenCV UI。
- 复杂图像处理。

对应学习阶段：

- [[02-从零到Python MVP学习路线]] 的阶段4。

### 4. AI 例程测试手册

本地 PDF：

- [03【正点原子】ATK-DLRK3568_AI例程测试手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/01、测试文档/03【正点原子】ATK-DLRK3568_AI例程测试手册V1.0.pdf>)

什么时候看：

- OpenCV Camera 已跑通后。
- 准备验证 RKNN/NPU 时。

当前只看：

- 第 2 章：更新 RKNN runtime。
- 第 5.1 节：安装 RKNN Toolkit Lite2。
- 第 5.3 节：运行 `01_lenet`。
- 第 6 章：Camera AI 例程，用于参考 SCRFD 和 YOLO。

暂时不看：

- 模型转换。
- YOLOv8。
- Linux5.10 AI 文档。
- 量化训练。

对应学习阶段：

- [[02-从零到Python MVP学习路线]] 的阶段5和阶段6。

### 5. RTMP 推流手册

本地 PDF：

- [18【正点原子】ATK-DLRK3568_RTMP推流V1.1.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/18【正点原子】ATK-DLRK3568_RTMP推流V1.1.pdf>)

什么时候看：

- Camera + AI + MIPI 已跑通后。
- 准备把视频输出到 Windows 时。

当前只看：

- FFmpeg 推流。
- Nginx RTMP。
- 客户端拉流验证。

暂时不看：

- RTSP。
- 低延迟优化。
- 硬件编码。

对应学习阶段：

- [[02-从零到Python MVP学习路线]] 的阶段8。

## 第二优先级 PDF

### MIPI 屏幕方向

本地 PDF：

- [23【正点原子】基于Buildroot系统MIPI屏幕横屏显示设置V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/23【正点原子】基于Buildroot系统MIPI屏幕横屏显示设置V1.0.pdf>)
- [07【正点原子】ATK-DLRK3568三屏显示参考手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/07【正点原子】ATK-DLRK3568三屏显示参考手册V1.0.pdf>)

什么时候看：

- MIPI 屏只显示一部分。
- 画面方向不对。
- 想理解板端显示链路。

对应专项：

- [[MIPI屏显示链路]]

### 静态 IP

本地 PDF：

- [36【正点原子】基于Buildroot系统设置静态IP参考手册V1.1.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/36【正点原子】基于Buildroot系统设置静态IP参考手册V1.1.pdf>)

当前结论：

```text
当前板子 WiFi 由 ConnMan 管理。
已采用静态别名 IP 方案：192.168.0.230。
这份 PDF 暂时作为备用查证，不作为主线。
```

### 文件传输

本地 PDF：

- [14【正点原子】Ubuntu&Windows&Linux开发板互传文件参考手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/14【正点原子】Ubuntu&Windows&Linux开发板互传文件参考手册V1.0.pdf>)
- [26【正点原子】FTP服务器搭建使用手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/26【正点原子】FTP服务器搭建使用手册V1.0.pdf>)
- [31【正点原子】基于Buildroot系统搭建Samba服务器参考手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/31【正点原子】基于Buildroot系统搭建Samba服务器参考手册V1.0.pdf>)

当前结论：

```text
日常优先用 scp。
FTP/Samba 不是当前主线。
```

### WSL / Ubuntu / 交叉编译

本地 PDF：

- [15【正点原子】Ubuntu环境搭建&VSCode安装使用V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/15【正点原子】Ubuntu环境搭建&VSCode安装使用V1.0.pdf>)
- [33【正点原子】基于Buildroot系统_交叉编译器安装与使用参考手册V1.0.pdf](<file:///E:/【正点原子】RK3568开发板资料（A盘）-基础资料/10、用户手册/03、辅助文档/33【正点原子】基于Buildroot系统_交叉编译器安装与使用参考手册V1.0.pdf>)

什么时候看：

- 进入 C++ 工程化。
- 编译板端程序。
- 需要交叉编译 OpenCV/RKNN C API。

当前结论：

```text
现在先不进入 C++ 主线。
WSL 环境已能支持代码整理和部署脚本。
```

## 暂时不作为主线的资料

不要在当前阶段主动看：

- Android 系列手册。
- Qt 系列手册。
- OpenHarmony 系列手册。
- Linux 驱动开发指南。
- U-Boot 启动流程笔记。
- Linux5.10 AI 例程测试手册。

原因：

```text
当前目标是复盘 Python MVP 闭环。
这些资料会把注意力拉到系统移植、UI 或底层驱动，和当前学习目标不匹配。
```

## 外部官方资料

### Linux / Camera

- [Linux V4L2 用户空间 API](https://www.kernel.org/doc/html/latest/userspace-api/media/v4l/v4l2.html)
- [Linux Media Controller API](https://www.kernel.org/doc/html/latest/userspace-api/media/mediactl/media-controller.html)

用途：

```text
补 V4L2、/dev/video、media controller、mmap 采集这些通用概念。
```

### GStreamer

- [GStreamer Documentation](https://gstreamer.freedesktop.org/documentation/)
- [GStreamer v4l2src](https://gstreamer.freedesktop.org/documentation/video4linux2/v4l2src.html)
- [GStreamer appsink](https://gstreamer.freedesktop.org/documentation/app/appsink.html)

用途：

```text
理解为什么 OpenCV 要通过 pipeline 读取 /dev/video0。
```

### OpenCV

- [OpenCV VideoCapture](https://docs.opencv.org/4.x/d8/dfe/classcv_1_1VideoCapture.html)
- [OpenCV color conversion](https://docs.opencv.org/4.x/d8/d01/group__imgproc__color__conversions.html)

用途：

```text
理解 VideoCapture、BGR、颜色转换和图像保存。
```

### RKNN

- [Rockchip RKNN Toolkit2](https://github.com/airockchip/rknn-toolkit2)

用途：

```text
理解 RKNN Toolkit2、RKNNLite、runtime、NPU 推理链路。
```

### FFmpeg / HLS / RTMP

- [FFmpeg Documentation](https://ffmpeg.org/ffmpeg.html)
- [FFmpeg HLS muxer](https://ffmpeg.org/ffmpeg-formats.html#hls-2)
- [nginx-rtmp-module](https://github.com/arut/nginx-rtmp-module)

用途：

```text
理解 FFmpeg 编码、RTMP 推流、HLS m3u8/ts 分片。
```

### Buildroot

- [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html)

用途：

```text
理解 Buildroot 是怎么生成嵌入式 Linux 系统的。
当前只做概念补充，不展开 SDK 编译。
```

#资料 #PDF #外部链接 #V4L2 #GStreamer #OpenCV #RKNN #FFmpeg
