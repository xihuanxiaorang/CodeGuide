---
title: 剑指 Offer 09. 用两个栈实现队列
tags: 
  - 数据结构
  - 栈
  - 队列
  - 刷题 
  - leetcode
  - 剑指 offer
created: 2022-11-15 02:49:59
modified: 2022-11-15 02:49:59
number headings: auto, first-level 1, max 6, _.1.1.
---

# 剑指 Offer 09. 用两个栈实现队列

## 1. 题目

用两个栈实现一个队列。队列的声明如下，请实现它的两个函数 `appendTail` 和 `deleteHead` ，分别完成在队列尾部插入整数和在队列头部删除整数的功能。(若队列中没有元素，`deleteHead` 操作返回 -1 )

 

**示例 1：**

```
输入：
["CQueue","appendTail","deleteHead","deleteHead","deleteHead"]
[[],[3],[],[],[]]
输出：[null,null,3,-1,-1]
```

**示例 2：**

```
输入：
["CQueue","deleteHead","appendTail","appendTail","deleteHead","deleteHead"]
[[],[],[5],[2],[],[]]
输出：[null,-1,null,null,5,2]
```

**提示：**

- `1 <= values <= 10000`
- 最多会对 ` appendTail、deleteHead ` 进行 ` 10000` 次调用

## 2. 题解

```java
private final Stack<Integer> s1 = new Stack<>();
private final Stack<Integer> s2 = new Stack<>();

public void appendTail(int value) {
    s1.push(value);
}

public int deleteHead() {
    if (s2.isEmpty()) {
        if (s1.isEmpty()) return -1;
        while (!s1.isEmpty()) {
            s2.push(s1.pop());
        }
    }
    return s2.pop();
}
```

