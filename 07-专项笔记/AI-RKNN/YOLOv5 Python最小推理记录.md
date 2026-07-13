# YOLOv5 Python最小推理记录

## 当前目标

当前主线已经调整为：

```text
现在用 Python 冲完整闭环，后面用 C++ 做项目升级。
```

因此 YOLO 阶段不先继续 C++，而是先做 Python 最小推理：

```text
图片 -> YOLOv5 RKNN -> 后处理 -> 检测框 -> JPG
```

跑通后再接：

```text
Camera -> YOLOv5 RKNN -> MIPI屏
```

## 为什么先用YOLOv5

当前板端系统是：

```text
Buildroot Linux 4.19
```

官方 4.19 AI 例程中有：

```text
01、源码/06_yolov5/rknn_yolov5_demo.zip
```

Linux5.10 AI 资料中才有：

```text
10_yolov8/yolov8.zip
```

所以当前优先选择 YOLOv5：

```text
先用当前系统资料里最匹配的官方 RKNN 模型跑通目标检测闭环。
YOLOv8 后置。
```

## 官方资料来源

```text
E:\【正点原子】RK3568开发板资料（A盘）-基础资料\01、程序源码\01、AI例程\01、源码\06_yolov5\rknn_yolov5_demo.zip
```

已解压到：

```text
E:\RK3568\yolo_stage\rknn_yolov5_demo
```

官方模型文件：

```text
yolov5s_relu_tk2_RK356X_i8.rknn
yolov5s_tk2_RK356X_i8.rknn
yolov5m_tk2_RK356X_i8.rknn
```

当前优先使用：

```text
yolov5s_relu_tk2_RK356X_i8.rknn
```

原因：

```text
模型小，适合第一轮跑通。
官方脚本 yolov5.sh 默认也使用这个模型。
```

## 已整理文件

WSL 项目目录：

```text
\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\yolov5_object
```

当前文件：

```text
main_image.py
README.md
yolov5s_relu_tk2_RK356X_i8.rknn
RK_anchors_yolov5.txt
coco_80_labels_list.txt
```

Windows 板端中转目录：

```text
E:\RK3568\yolo_stage\python_files
```

## 当前脚本

```text
main_image.py
```

职责：

- 读取图片。
- letterbox 到 `640x640`。
- BGR 转 RGB。
- 调用 `rknnlite` 加载 YOLOv5 RKNN 模型。
- 解析 3 个输出分支。
- 根据 anchors 和 stride 做 YOLOv5 后处理。
- NMS。
- 把检测框映射回原图。
- 保存结果 JPG。

## 当前验证状态

已完成：

```text
WSL 本地 py_compile 语法检查通过。
模型、anchors、labels、脚本已放入 Windows 中转目录。
文件已复制到板端 /userdata/aidemo/06_yolov5_python。
YOLOv5 RKNN 单图推理已在板端跑通。
```

关键结论：

```text
RKNN inference 正常。
output_shapes 已确认。
Python 后处理能解析出目标框。
结果图能正常写出。
```

## 板端建议目录

```text
/userdata/aidemo/06_yolov5_python
```

## 板端运行命令

先准备一张测试图片。可以复用之前的 OpenCV 抓图：

```text
/tmp/opencv_frame_gst.jpg
```

如果板端没有这张图，可以先用 Camera 脚本重新保存一张，或者从 Windows 传入。

运行：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_image.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --image /tmp/opencv_frame_gst.jpg \
  --output /tmp/yolov5_result.jpg
```

期望输出：

```text
output_shapes [...]
detections N
write True /tmp/yolov5_result.jpg
```

实测输出：

```text
output_shapes [(1, 255, 80, 80), (1, 255, 40, 40), (1, 255, 20, 20)]
detections 0
write True /tmp/yolov5_result.jpg
```

说明：

```text
/tmp/opencv_frame_gst.jpg 是当前桌面/线缆画面，没有明显 COCO 目标，所以 detections 0 是合理现象。
这一步已经证明模型加载、NPU 推理、输出张量获取、结果图写出都正常。
```

## 标准测试图验证

为了确认后处理逻辑不是空跑，使用 YOLO 官方常见测试图 `bus.jpg` 再跑一次。

板端命令：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_image.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --image bus.jpg \
  --output /tmp/yolov5_bus_result.jpg
```

实测输出：

```text
output_shapes [(1, 255, 80, 80), (1, 255, 40, 40), (1, 255, 20, 20)]
detections 4
person 0.880 (215, 404, 349, 860)
person 0.874 (674, 396, 808, 890)
person 0.840 (52, 404, 255, 898)
bus 0.693 (13, 223, 803, 776)
write True /tmp/yolov5_bus_result.jpg
```

结果图：

```text
板端：/tmp/yolov5_bus_result.jpg
Windows：E:\RK3568\yolo_stage\python_files\yolov5_bus_result.jpg
Obsidian：05-实验与证据/实验产物/assets/yolov5_bus_result.jpg
```

预览：

![[yolov5_bus_result.jpg]]

## 当前结论

```text
图片 -> YOLOv5 RKNN -> 后处理 -> 检测框 -> JPG
```

已经跑通。

在该验证点还没有接 Camera，不代表项目完成；它只说明 YOLOv5 RKNN 推理和后处理链路单独成立。

历史决策：当时的下一步是：

```text
Camera -> 单帧 -> YOLOv5 RKNN -> JPG
```

历史决策：当时再后一步是：

```text
Camera -> YOLOv5 RKNN -> MIPI屏实时显示
```

## Camera单帧验证

单图推理成功后，新增脚本：

```text
WSL：\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\yolov5_object\main_gst_one_frame.py
板端：/userdata/aidemo/06_yolov5_python/main_gst_one_frame.py
```

核心变化：

```text
main_image.py：从图片文件 cv2.imread() 输入。
main_gst_one_frame.py：从 /dev/video0 通过 GStreamer pipeline 抓一帧输入。
```

板端命令：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_gst_one_frame.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --output /tmp/yolov5_camera_result.jpg \
  --raw-output /tmp/yolov5_camera_raw.jpg
```

实测输出：

```text
output_shapes [(1, 255, 80, 80), (1, 255, 40, 40), (1, 255, 20, 20)]
detections 1
person 0.684 (0, 0, 773, 719)
write True /tmp/yolov5_camera_result.jpg
```

结果文件：

```text
原始抓图：/tmp/yolov5_camera_raw.jpg
检测结果：/tmp/yolov5_camera_result.jpg
Windows：E:\RK3568\yolo_stage\python_files\yolov5_camera_result.jpg
Obsidian：05-实验与证据/实验产物/assets/yolov5_camera_result.jpg
```

预览：

![[yolov5_camera_result.jpg]]

说明：

```text
OpenCV 打印的 Cannot query video position 是实时流无法查询进度的普通警告，不影响采集和检测。
```

本页实测结论：

```text
Camera -> 单帧 -> YOLOv5 RKNN -> 检测框 -> JPG
```

已经跑通。

历史决策：当时的下一步：

```text
Camera -> YOLOv5 RKNN -> cv2.imshow -> MIPI屏实时显示
```

## MIPI屏实时显示验证

新增实时脚本：

```text
WSL：\\wsl$\Ubuntu-20.04\home\rk3568\work\rk3568_ai_camera\experiments\yolov5_object\main_gst_realtime.py
板端：/userdata/aidemo/06_yolov5_python/main_gst_realtime.py
```

板端命令：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_gst_realtime.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --frames 100 \
  --display \
  --save-every 50 \
  --output /tmp/yolov5_realtime_last.jpg
```

实测输出：

```text
frame 50 fps 3.918 detections 2
frame 100 fps 4.111 detections 2
processed_frames 100
elapsed_sec 24.424
fps 4.094
avg_detections_per_frame 2.180
saved True /tmp/yolov5_realtime_last.jpg
```

结果文件：

```text
板端：/tmp/yolov5_realtime_last.jpg
Windows：E:\RK3568\yolo_stage\python_files\yolov5_realtime_last.jpg
Obsidian：05-实验与证据/实验产物/assets/yolov5_realtime_last.jpg
```

预览：

![[yolov5_realtime_last.jpg]]

当前结论：

```text
Camera -> GStreamer -> OpenCV -> YOLOv5 RKNN -> cv2.imshow -> MIPI屏
```

已经跑通。

注意：

```text
当前 YOLOv5s 单模型实时速度约 4 FPS，低于 SCRFD 的约 6.6 FPS。
这一步目标是验证闭环，不是做性能优化。
检测结果存在误检，例如局部物体被识别为 cup，后续可通过阈值、输入分辨率、模型选择再优化。
```

## 2026-05-31 日志收口复测

复测原因：

```text
上一轮实时测试里每帧都会打印 output_shapes，日志太吵。
已把 output_shapes 改成只有加 --verbose 时才打印。
```

复测命令：

```bash
cd /userdata/aidemo/06_yolov5_python
python3 main_gst_realtime.py \
  --model yolov5s_relu_tk2_RK356X_i8.rknn \
  --anchors RK_anchors_yolov5.txt \
  --labels coco_80_labels_list.txt \
  --frames 30 \
  --display \
  --output /tmp/yolov5_realtime_clean_last.jpg
```

实测输出：

```text
frame 10 fps 3.001 detections 1
frame 20 fps 3.594 detections 1
frame 30 fps 3.862 detections 1
processed_frames 30
elapsed_sec 7.858
fps 3.818
avg_detections_per_frame 1.000
saved True /tmp/yolov5_realtime_clean_last.jpg
```

结果文件：

```text
板端：/tmp/yolov5_realtime_clean_last.jpg
Windows：E:\RK3568\yolo_stage\python_files\yolov5_realtime_clean_last.jpg
Obsidian：05-实验与证据/实验产物/assets/yolov5_realtime_clean_last.jpg
```

预览：

![[yolov5_realtime_clean_last.jpg]]

日志结论：

```text
脚本自己的 output_shapes 噪声已经消失。
RKNN runtime 的 warning 仍然会输出，而且不是普通 stderr 重定向能完全压住。
这些 warning 不影响当前功能，后续如果需要干净终端，再做外层日志过滤。
```

## 风险点

当前 Python 后处理是按官方 C++ `yolo.cc` 移植的第一版。

可能需要根据板端实际 `output_shapes` 微调：

- 输出是否是 CHW。
- 输出是否已经反量化成 float。
- 输出分支顺序是否对应 stride `8/16/32`。
- `sigmoid` 是否需要补回。

这些风险点已经通过 `bus.jpg` 初步排除：

```text
输出是 CHW 结构。
输出已经是 float32，数值范围大约 0.0 ~ 0.98，不需要手动反量化。
3 个输出分支顺序对应 stride 8/16/32。
当前 sigmoid + anchors + NMS 后处理能得到合理检测框。
```

#YOLOv5 #RKNN #Python #目标检测

## 知识补充：从图像到检测框

### 状态：已验证 + 通用原理

完整推理不是“调用一次 `inference` 就得到框”，而是：

```text
BGR frame
-> resize / letterbox
-> RGB 或模型要求的通道顺序
-> NHWC/NCHW 排布
-> dtype / quantization
-> RKNN inference
-> 输出 tensor 解码
-> confidence filter
-> NMS
-> padding/scale 反变换
-> 原图坐标框
```

常见错位原因：

- 训练或转换要求 RGB，却把 BGR 直接送入模型。
- 模型要求 NCHW，却传入 NHWC。
- letterbox 后忘记去除 padding，导致框整体偏移。
- 量化模型仍按浮点模型的范围和 dtype 送入。
- NMS 前后的坐标尺度不一致。

调试时先保存一张固定输入、前处理后的 tensor 摘要、原始输出 shape 和最终框，先让单图结果正确，再接 Camera 和显示。

## 阶段验收

- 能区分 Toolkit/转换阶段、板端 Runtime、NPU 驱动和 Python 应用。
- 能说明模型输入 shape、颜色顺序、dtype 和量化配置的来源。
- 能用固定图片复测框位置，再解释 Camera 场景的坐标回映。
- 性能记录至少包含输入分辨率、推理耗时或帧率，不能只写“实时”。
