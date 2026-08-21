# GStreamer专题-为什么OpenCV直接读取失败

## 要回答的问题

```text
为什么 cv2.VideoCapture(0) 失败，而 GStreamer pipeline 成功？
```

## 当前项目里的位置

```text
/dev/video0 -> GStreamer -> OpenCV Mat
```

## 当前成功 pipeline

```text
v4l2src device=/dev/video0
! video/x-raw,format=NV12,width=1280,height=720
! videoconvert
! video/x-raw,format=BGR
! appsink drop=1 sync=false
```

## 必须讲清的点

- `v4l2src` 从 `/dev/video0` 取帧。
- `video/x-raw,format=NV12` 明确告诉 pipeline 输入格式。
- `videoconvert` 把 NV12 转成 OpenCV 更容易处理的 BGR。
- `appsink` 把 GStreamer pipeline 的输出交给 Python/OpenCV。
- 当前 RKISP V4L2 multiplanar 节点不适合直接依赖 `cv2.VideoCapture(0)` 默认打开。

## 要补的图

```text
Camera
 ↓
v4l2src
 ↓
NV12
 ↓
videoconvert
 ↓
BGR
 ↓
appsink
 ↓
OpenCV Mat
```

## 面试表达草稿

```text
我一开始尝试过 cv2.VideoCapture(0)，但在 RK3568 出厂 Buildroot 上打开失败。
原因是 /dev/video0 是 RKISP 的 V4L2 multiplanar 采集节点，OpenCV 默认后端不能稳定处理。
所以我改成显式 GStreamer pipeline，明确指定 v4l2src、NV12 格式、分辨率、videoconvert 和 appsink。
这样 OpenCV 拿到的就是标准 BGR Mat，后续可以直接送给 YOLO 前处理。
```

## 关联笔记

- [[OpenCV读取Camera记录]]
- [[01-概念索引]]

#GStreamer #OpenCV #V4L2 #NV12 #BGR
