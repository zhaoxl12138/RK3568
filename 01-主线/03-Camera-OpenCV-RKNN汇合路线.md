# Camera-OpenCV-RKNN汇合路线

本文件不是“今天先做什么”的主线。

它只回答一个问题：

```text
为什么 Camera、OpenCV、RKNN 这三条链路最后能汇到同一个 AI Camera 项目里？
```

只在两个场景下打开：

- 你走到阶段6，想专门理解为什么 Camera、OpenCV、RKNN 能汇合。
- 你后面复盘项目时，想回头看当时的历史决策和汇合路径。

如果你现在只是想知道“今天先学什么”，回到：

- [[02-从零到Python MVP学习路线|01-主线 / 从零到Python MVP学习路线]]

## 当前定位

当前状态：

```text
YOLOv5 RKNN Python MVP 已经跑通。
本文件主要用于解释 Camera、OpenCV、RKNN 三条链路如何汇合，不再作为当前下一步任务清单。
```

跨模块汇合的完成条件，统一参考 [[AI Camera分阶段验收标准|07-专项笔记 / 系统 / 分阶段验收标准]] 的阶段 6。

把已经跑通的 Camera、OpenCV、RKNN 链路合成后续 AI Camera 项目路线。

不是继续单独验证 Camera，也不是单独跑 AI demo，而是开始建立真实项目闭环：

```text
Camera -> OpenCV Mat -> 前处理 -> RKNN 推理 -> 后处理 -> 显示/推流
```

## 三条已跑通的链路

### 链路一：Camera 到 OpenCV

已经确认：

```text
IMX415 MIPI Camera
-> RKISP
-> /dev/video0
-> GStreamer pipeline
-> OpenCV Mat
-> JPG
```

稳定方式：

```text
v4l2src device=/dev/video0
! video/x-raw,format=NV12,width=1280,height=720
! videoconvert
! video/x-raw,format=BGR
! appsink
```

关键结论：

- `v4l2-ctl` 可以直接抓 NV12。
- OpenCV 的 `cv2.VideoCapture(0)` 在当前板子上不能直接打开 Camera。
- 当前必须使用显式 GStreamer pipeline。
- OpenCV 最终拿到的是 BGR 三通道图像，形状类似 `(720, 1280, 3)`。

### 链路二：RKNN 最小推理

已经确认：

```text
Python
-> rknnlite
-> LeNet5_mnist_model.rknn
-> RKNN Runtime 1.5.0
-> NPU Driver 0.8.2
-> 推理结果
```

`01_lenet` 输出：

```text
[5]: 1.0
```

关键结论：

- `rknn-toolkit-lite2-1.5.0` 已安装。
- `rknn_server/librknnrt.so` 已更新到 1.5.0。
- 旧 1.3.0 运行库已备份到 `/userdata/rknn_backup_1.3.0`。
- NPU 最小推理链路可用。

### 链路三：Camera 到 RKNN 人脸检测

已经确认：

```text
IMX415 Camera
-> GStreamer
-> OpenCV BGR Mat
-> SCRFD RKNN
-> 后处理
-> 人脸框 + 5 点关键点
-> JPG
```

结果：

```text
faces 1
```

结果图：

```text
E:\RK3568\face_stage\result\scrfd_result_rotated.jpg
```

关键结论：

- `11_facedet_scrfd_npu` 不能原样使用 `cv2.VideoCapture(0)`。
- 改成 GStreamer pipeline 后 Camera 可以打开。
- 需要保持官方源码里的旋转逻辑，否则画面横置，人脸检测可能失败。
- 当前已经验证 Camera 实时帧可以进入 RKNN 检测模型。

## 汇合后会变成什么

后续项目里的每一帧大致会走这个流程：

```text
1. Camera 采集
2. OpenCV 得到 BGR Mat
3. resize / letterbox / normalize
4. RKNNLite inference
5. 解析模型输出
6. NMS / mask / keypoint 等后处理
7. OpenCV 画框、画线、叠加结果
8. 显示或推流
```

对应到代码模块：

```text
camera_capture
-> preprocessor
-> rknn_infer
-> postprocessor
-> renderer
-> streamer
```

## 当时为什么还要单独拆开看

### 1. Camera 输入这一层

官方很多 AI 例程直接写：

```python
cap = cv2.VideoCapture(0)
```

但当前实测这个方式失败。

所以后续跑官方实时 AI 例程时，需要替换成：

```python
pipeline = (
    'v4l2src device=/dev/video0 '
    '! video/x-raw,format=NV12,width=1280,height=720 '
    '! videoconvert '
    '! video/x-raw,format=BGR '
    '! appsink drop=1 sync=false'
)
cap = cv2.VideoCapture(pipeline, cv2.CAP_GSTREAMER)
```

### 2. 模型前处理这一层

不同模型输入尺寸不同：

- `01_lenet`: 手写数字，非 Camera 实时场景。
- `SCRFD`: 输入 `640x640`，人脸检测。
- `PP-HumanSeg`: 输入 `192x192`，人像分割。
- `YOLOP`: 输入 `640x640`，车/车道线/可行驶区域。

后续重点不是“模型名字”，而是理解：

```text
原始 Camera 帧 -> 模型要求的输入尺寸和格式
```

### 3. 后处理这一层

RKNN 输出通常不是直接能看的图像。

需要后处理：

- 分类：取 top-k。
- 检测：decode box、置信度过滤、NMS。
- 分割：mask resize、颜色叠加。
- 关键点：坐标还原、画点。

### 4. 工程化这一层

目前仍是 Python demo 阶段。

后续项目要逐步转向：

```text
C++17 / CMake / Linux 工程结构
```

但现在还不急着上 C++，先用 Python 把链路概念跑透。

## 历史决策记录：官方例程选择

历史状态：

```text
当时还没有完成 Camera + RKNN 汇合，所以不建议直接跑 06_yolov5。
现在 YOLOv5 RKNN Python MVP 已经跑通，这段只作为当时决策复盘保留。
```

原因：

- YOLOv5 例程是压缩包，体积大。
- 更偏模型检测 demo，不一定接 Camera。
- 你当前更需要验证“Camera 实时帧进入 RKNN”的链路。

更合适的候选：

### 优先候选：`11_facedet_scrfd_npu`

价值：

- 源码短。
- 模型小。
- 直接接 Camera。
- 输出画框和 5 点关键点，效果直观。
- 和 AI Camera 岗位更贴近。

需要修改：

```text
cv2.VideoCapture(0)
```

改成显式 GStreamer pipeline。

### 次选：`12_pp_human_seg_npu`

价值：

- 源码更短。
- 分割结果直观。
- 输入尺寸小，可能更轻。

不足：

- 不是目标检测，对 YOLO 项目路线帮助稍弱。

### 后置：`10_carseg_yolop_npu`

价值：

- 和车载视觉方向相关。
- 包含检测、车道线、可行驶区域。

不足：

- 模型和后处理更复杂。
- 当前阶段容易分散注意力。

## 历史下一步和当前状态

`11_facedet_scrfd_npu` 单帧检测已经跑通。

已经完成：

```text
1. 读完 AI 手册第 6 章。
2. 复制官方 11_facedet_scrfd_npu 到板端。
3. 把 Camera 打开方式改成 GStreamer pipeline。
4. 单帧抓取 Camera 图像。
5. 旋转图像方向。
6. 运行 SCRFD RKNN 推理。
7. 输出人脸框、置信度和 5 点关键点。
8. 保存检测结果 JPG。
```

本阶段重点：

```text
Camera 实时帧 -> RKNN 模型 -> 后处理 -> 画框输出
```

当前已验证通过。

历史后续选择：

- 先把 Python 实验代码整理成项目目录，再继续跑 YOLO/YOLOP。
- 后续再把单帧脚本改成实时循环显示。

历史决策：

```text
整理优先级最高。
```

原因：

```text
现在已经连续跑通 Camera、OpenCV、RKNN、SCRFD，继续堆临时脚本会让项目不可维护。
先整理实验代码和记录，再进入下一个技术点。
```

现在回头看：

```text
YOLOv5 Python MVP 已完成 Camera -> RKNN -> MIPI -> RTMP/HLS -> Windows 拉流。
本文件后续只作为“汇合链路解释”和“历史决策复盘”使用。
```

暂时不做：

- YOLOv8n。
- ONNX 转 RKNN。
- C++ 重构。
- RTSP 推流。

## 关联

- [[01-AI视觉系统主线]]
- [[OpenCV读取Camera记录]]
- [[官方AI例程运行记录]]
- [[01-下一步任务看板]]

#主线 #Camera #OpenCV #RKNN #AI视觉
