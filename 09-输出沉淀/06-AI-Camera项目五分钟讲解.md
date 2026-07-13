# AI-Camera项目五分钟讲解

## 一句话版本

```text
这是一个基于 RK3568 的边缘 AI Camera 项目，完成了从 IMX415 MIPI 摄像头采集、OpenCV 处理、RKNN NPU 推理、MIPI 屏显示到 HLS 网络拉流的完整闭环。
```

## 五分钟主线

```text
IMX415 通过 MIPI CSI 接入 RK3568。
图像数据进入 RKISP，RKISP 通过 V4L2 把主采集路径暴露成 /dev/video0。
应用层用 GStreamer 从 /dev/video0 读取 NV12 数据，并通过 videoconvert 转成 OpenCV 可处理的 BGR Mat。
然后 Python 调用 RKNNLite 加载 YOLOv5 RKNN 模型，通过 RKNN runtime 和 NPU driver 完成推理。
推理输出经过后处理得到检测框，再叠加到图像上。
结果一方面通过 OpenCV 显示到 MIPI 屏，另一方面通过 FFmpeg 推到 Nginx RTMP，再转成 HLS 给 Windows ffplay 拉流。
```

## 必须能展开讲的五个点

1. Camera 为什么是 `/dev/video0`。
2. 为什么 OpenCV 不能直接用 `cv2.VideoCapture(0)`。
3. GStreamer pipeline 每一段负责什么。
4. RKNN runtime、RKNNLite、NPU driver 的关系。
5. YOLOv5 检测框来自前处理、推理、后处理，不是简单“模型输出”。

## 当前实测结果

```text
YOLOv5 + MIPI 屏实时显示：约 3.8 - 4.1 FPS
YOLOv5 + RTMP/HLS 输出：约 4.9 - 5.0 FPS
Windows 拉流地址：http://192.168.0.230/hls/yolo.m3u8
```

> 口径说明：这些是当前 YOLOv5 Python MVP 的实测结果。讲解时不要把它们表述成 YOLOv8n、C++ 或通用硬件性能；证据索引见 [[01-实验产物索引|08-附录 / 实验产物索引]]。

## 当前项目价值

```text
这个项目的重点不是训练 YOLO，而是把 Camera、Linux 多媒体、AI 推理、显示和推流串成一个可运行的边缘视觉系统。
```

## 关联笔记

- [[02-AI Camera项目讲解稿]]
- [[03-Python MVP演示手册]]
- [[01-一个月带问题复盘计划]]

#项目讲解 #面试表达 #AICamera
