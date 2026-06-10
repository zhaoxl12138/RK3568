# YOLOv5专题-检测框是怎么出来的

## 要回答的问题

```text
YOLO 检测框到底是怎么出来的？
```

## 当前项目里的位置

```text
OpenCV Mat -> YOLOv5 前处理 -> RKNN 推理 -> YOLOv5 后处理 -> 检测框
```

## 必须讲清的点

前处理：

- resize
- letterbox
- BGR/RGB
- normalize
- 输入 shape

推理：

- `rknn.inference()`
- NPU 执行模型
- 输出多个尺度的 raw outputs

后处理：

- decode bbox
- confidence threshold
- class score
- NMS
- draw boxes

## 当前项目结论

```text
模型输出不是最终检测框。
YOLOv5 的检测框来自前处理、模型推理和后处理三段共同结果。
```

## 面试表达草稿

```text
YOLOv5 检测框不是简单由模型直接给出。
我先把 OpenCV 读到的 BGR 图像按模型输入要求做 resize 和 letterbox，再送入 RKNN 模型推理。
RKNN 输出的是多个尺度的候选框特征，后处理阶段再做 bbox decode、置信度过滤、类别选择和 NMS，最后才得到可画在图像上的检测框。
```

## 关联笔记

- [[YOLOv5 Python最小推理记录]]
- [[03-RKNN专题-RKNN运行机制]]
- [[02-从零到Python MVP学习路线]]

#YOLOv5 #前处理 #后处理 #NMS #RKNN
