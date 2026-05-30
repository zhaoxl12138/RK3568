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
```

待完成：

```text
复制到板端运行。
验证 output_shapes。
验证 detections 数量和结果图。
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

## 风险点

当前 Python 后处理是按官方 C++ `yolo.cc` 移植的第一版。

可能需要根据板端实际 `output_shapes` 微调：

- 输出是否是 CHW。
- 输出是否已经反量化成 float。
- 输出分支顺序是否对应 stride `8/16/32`。
- `sigmoid` 是否需要补回。

因此第一轮目标不是一次就完美检测，而是先拿到：

```text
output_shapes
是否能成功 inference
是否能生成结果图
```

#YOLOv5 #RKNN #Python #目标检测
