---
doc-type: reference
title: 实验与证据图片资产清单
publish-status: published
updated: 2026-08-10
---

# 实验与证据图片资产清单

这些图片是课程硬件/数据手册的正式引用副本，不等同于板端运行证据。为避免破坏当前课程运行时与 `06-任务` 入链，本次在 `05-实验与证据/assets/` 建立正式副本，同时保留原路径文件；未删除 `tmp/pdfs/` 中的来源渲染图。

| 正式资产 | SHA-256 | 尺寸 | 原始整页 / 裁剪 | 来源与页码 | 用途 |
|---|---|---:|---|---|---|
| `IMX415-Sony上电时序-第84页.png` | `28EF940E74E549984464C28E54118C0943DDC6E265DC38AF557BC9D231B886BF` | 953×1348 | 原始整页渲染，未检测到裁剪差异 | IMX415 datasheet，第 84 页；仓库未保存来源 PDF 文件名 | 核对 IMX415 上电时序 |
| `IMX415-Sensor引脚.png` | `1CAE3CF1191522AD378CB25D21B996765C4994617145C4C805195DD88D9319EF` | 540×829 | 裁剪图 | 来源文档文件名与 PDF 页码未记录 | 课程中识别 Sensor 引脚；不能据此审计完整页上下文 |
| `主板-MIPI-CSI接口.png` | `CD9F09B0E29E3BC77709AF19ADDEB51CA26111AB444DB2DE461F312129FC056B` | 811×508 | 裁剪图 | RK3568 板卡原理图摘录；来源 PDF 文件名与页码未记录 | 对照主板 MIPI CSI 接口；不能替代完整原理图 |

## 哈希重复记录

- `tmp/pdfs/imx415-datasheet-page-84.png` 与正式资产 `IMX415-Sony上电时序-第84页.png` 的 SHA-256 都是 `28EF940E74E549984464C28E54118C0943DDC6E265DC38AF557BC9D231B886BF`。
- 按本次“不删除源图片”的约束，`tmp/pdfs/imx415-datasheet-page-84.png` 暂时保留；正式引用只使用 `05-实验与证据/assets/IMX415-Sony上电时序-第84页.png`。

## 来源保留策略

- `06-任务/assets/` 中现有三张图继续保留，以保证当前课程 Markdown 链接不漂移。
- `tmp/pdfs/imx415-datasheet-page-85.png`、`imx415-datasheet-page-86.png` 和板卡原理图整页渲染不是本次选定正式资产，不移动、不删除。
- 未记录的来源 PDF 文件名或页码明确写“未记录”，不从图片内容猜测。
