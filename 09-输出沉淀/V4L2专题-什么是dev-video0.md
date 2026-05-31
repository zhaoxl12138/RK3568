# V4L2专题-什么是dev-video0

## 要回答的问题

```text
Linux 里 Camera 为什么最终变成 /dev/video0？
```

## 当前项目里的位置

```text
IMX415 -> MIPI CSI -> RKISP -> V4L2 -> /dev/video0 -> GStreamer
```

## 必须讲清的点

- `/dev/video0` 不是 sensor 本身。
- `/dev/video0` 是 RKISP 主采集通道暴露给用户态的 V4L2 节点。
- `/dev/media0` 用来描述 Camera、CSI、ISP、video node 之间的拓扑。
- `rkisp_mainpath` 是当前主采集输出。
- `rkisp_selfpath` 是另一路输出路径。
- `rkisp-statistics` 和 `rkisp-input-params` 服务于 ISP 统计和参数控制，不是普通图像采集口。

## 当前已验证事实

```text
/dev/video0          rkisp_mainpath
/dev/video-camera0  rkisp_mainpath
/dev/video1          rkisp_selfpath
/dev/video7          rkisp-statistics
/dev/video8          rkisp-input-params
/dev/media0          media controller 拓扑入口
```

## 要补的图

```text
IMX415
 ↓
MIPI CSI
 ↓
RKISP
 ↓
Media Controller
 ↓
V4L2
 ↓
/dev/video0
```

## 面试表达草稿

```text
这个项目里 Camera 并不是直接被 OpenCV 读取。
IMX415 先通过 MIPI CSI 接入 RK3568，图像数据进入 RKISP。
RKISP 完成 ISP 处理后，通过 V4L2 框架把主采集路径暴露成 /dev/video0。
应用层再通过 v4l2-ctl、GStreamer 或 OpenCV 间接读取这个节点。
```

## 关联笔记

- [[V4L2命令行抓帧记录]]
- [[00-概念索引]]
- [[01-从零到Python MVP学习路线]]

#V4L2 #Camera #RKISP #devvideo0
