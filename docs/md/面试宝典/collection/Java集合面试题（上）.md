---
title: Java 集合面试题（上）
tags:
  - 面试宝典
  - 集合 
onShowH2: true
created: 2022-11-25 13:23:59
modified: 2022-11-25 13:27:12
number headings: auto, first-level 1, max 6, _.1.1.
---

# Java 集合面试题（上）

## 1. 引言

![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202212011444016.png)

面试中经常被问到的集合有 `ArrayList`、`LinkedList`、`HashMap`、`CopyOnWriteArrayList`、`ConcurrentHashMap`，所以咱们 **必须掌握其源码**，不然稍微问深一点就不会了，对于这些集合不懂的小伙伴可以参考源码分析中的集合模块。

## 2. ArrayList 与 Vector 的区别？

- `ArrayList` 不是线程安全的；`Vector` 是线程安全的，在关键方法上都加了 `synchronized` 关键字。`Vector` 为 Java 早期版本中提供的容器，属于遗留容器，官方已不再推荐使用。
- `ArrayList` 扩容时新容量为原来的 1.5 倍，而 `Vector` 扩容时新容量为来的 2 倍。

## 3. ArrayList 与 LinkedList 有什么区别？

- 底层数据结构：`ArrayList` 底层实现是 **数组**，`LinkedList` 底层实现是 **双向链表**。
- 插入和删除元素的效率：首先需要知道两者插入和删除元素时时间都花费在哪，`ArrayList` 在不考虑扩容的情况下插入和删除元素的时间主要花费在 **拷贝数组** 上，而 `LinkedList` 插入和删除元素的时间主要花费在 **遍历找寻节点** 上，至于创建节点对象和移动指针与之比起来根本不算事。经过测试，`ArrayList` 仅在头部插入和删除元素时效率比 `LinkedList` 要差之外，其余情况（如在指定位置或者尾部插入和删除元素） `ArrayList` 都要优于 `LinkedList`，因为在头部插入和删除元素时 `ArrayList` 要将数组中所有的元素都向后或者向前移动一位，效率非常地低。
- 是否支持随机访问：`ArrayList` 支持随机访问，而 `LinkedList` 不支持。
- `LinkedList` 的每一个元素会占用更多的空间，因为它的每个元素需要存储除了数据之外的前驱和后继指针。

## 4. 说一下 ArrayList 的扩容机制

`ArrayList` 底层实现是数组，当往集合中添加元素时，如果检测到数组中的元素数量达到扩容阈值的时，则会进行扩容操作。扩容操作步骤如下：

1. 计算新数组的容量，为原数组容量的 1.5 倍，`int newCapacity = oldCapacity + (oldCapacity >> 1);`。
2. 创建新数组，将原数组中的数据全部拷贝到新数组中，`elementData = Arrays.copyof(elementData, newCapacity)`。

扩容操作的核心源码如下所示：

```java
private void grow(int minCapacity) {
    // overflow-conscious code
    int oldCapacity = elementData.length;
    // 新数组的容量，为原数组容量的 1.5 倍
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // 原数组中的数据全部拷贝到新数组中
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

## 5. ArrayList 怎么序列化的知道吗？ 为什么要用 transient 修饰数组？

`ArrayList` 实现了 `Serializable` 接口，说明了 `ArrayList` 支持序列化，然而 `ArrayList` 中的关键字段 `elementData`（也就是底层数组）被 `transient` 关键字修饰，该关键字的作用是让它修饰的字段不被序列化。为什么要这样做呢？因为 `ArrayList` 底层实现是数组，其底层数组的空间总有空余，出于对序列化与反序列化的效率以及内存空间的考虑，`ArrayList` 自定义了 `writeObject()` 和 `readObject()` 方法，这样在执行序列化和反序列化操作的时候就不是调用 `ObjectOutputStream` 和 `ObjectInputStream` 中默认的 `writeObject()` 和 `readObject()` 方法，而是使用 `ArrayList` 自定义的两个方法，这两个方法的源码如下所示：

<img src="https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202212021546784.png" style="zoom: 50%;" />

## 6. 请谈谈 fail-safe 机制与 fail-fast 机制分别有什么作用？

fail-safe 机制和 fail-fast 机制是多线程并发操作集合时的一种失败处理机制。

### 6.1. fail-fast 机制

fail-fast 表示快速失败，在集合的遍历过程中，一旦发现集合中的数据被修改过了，就会立刻抛出一个 `CocurrentModificationException` 的异常，从而导致整个遍历过程是失败的。类似如下这种情况：

```java
public class Test5 {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("marry");
        names.add("jack");
        names.add("tom");
        Iterator<String> iterator = names.iterator();
        while (iterator.hasNext()) {
            String name = iterator.next();
            if ("marry".equals(name)) {
                names.remove("marry");
            }
        }
    }
}
```

此处定义了一个 `ArrayList` 集合，使用 `Iterator` 迭代器对集合中的数据进行遍历，而在遍历的过程中，对集合中的数据做了一个变更，就会立刻抛出一个 `ConcurrentModificationException` 异常，异常信息如下所示：

```java
Exception in thread "main" java.util.ConcurrentModificationException
	at java.base/java.util.ArrayList$Itr.checkForComodification(ArrayList.java:1043)
	at java.base/java.util.ArrayList$Itr.next(ArrayList.java:997)
	at top.xiaorang.interview.javase.Test5.main(Test5.java:27)
```

如上这种情况就叫 fail-fast 机制，在 `java.util` 包下的集合类都是属于快速失败机制的，不能用于多线程环境下的并发修改，常见的使用这样一种机制的集合有 `ArrayList` 和 `HashMap` 等等。

为什么会抛出 `ConcurrentModificationException` 异常呢？原因有以下几点：①在调用 `ArrayList` 的 `iterator()` 方法的时候生成 `Iterator` 迭代器对象的时候，迭代器对象中的 `expectedModCount` 属性就已经确定；②使用 `ArrayList` 的 `remove()` 方法的时候，会让属性 `modCount`（结构修改次数）加一；③每次调用 `Iterator` 迭代器对象的 `next()` 方法时每次都会先检查 `expectedModCount == modCount`，如果不等的话，则会直接抛出 `ConcurrentModificationException` 异常。可想而知，调用 `ArrayList` 的 `remove()` 方法之后 `expectedModCount != modCount`，程序会在调用 `next()` 方法遍历下一个元素时会抛出异常。

```java
public E next() {
    checkForComodification();
    int i = cursor;
    if (i >= size)
        throw new NoSuchElementException();
    Object[] elementData = ArrayList.this.elementData;
    if (i >= elementData.length)
        throw new ConcurrentModificationException();
    cursor = i + 1;
    return (E) elementData[lastRet = i];
}

final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

阿里巴巴 Java 开发手册中提到：

```ad-important
【强制】不要在 foreach 循环里进行元素的 remove/add 操作。remove 元素请使用 Iterator 方式，如果并发操作，需要对 Iterator 对象加锁。
```

正确的使用方式如下：

```java
public class Test5 {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("marry");
        names.add("jack");
        names.add("tom");
        Iterator<String> iterator = names.iterator();
        while (iterator.hasNext()) {
            String name = iterator.next();
            if ("marry".equals(name)) {
                iterator.remove();
            }
        }
    }
}
```

为什么使用 `Iterator` 迭代器的 `remove()` 方法就没事呢？因为从如下迭代器中 `remove()` 方法的源码中可以得出：迭代器的 `remove()` 方法其实就是去调用了 `ArrayList` 的 `remove()` 方法，会让 `ArrayList` 的 `modCount` 属性加一，不过在迭代器的 `remove()` 方法最后会 **将修改过的 `modCount` 值同步给 `Iterator` 迭代器的 `expectedModCount`**，从而在调用 `Iterator` 迭代器的 `next()` 方法遍历下一个元素时并不会抛出异常。

```java
public void remove() {
    if (lastRet < 0)
        throw new IllegalStateException();
    checkForComodification();

    try {
        ArrayList.this.remove(lastRet);
        cursor = lastRet;
        lastRet = -1;
        // 将修改过的modCount值同步给expectedModCount
        expectedModCount = modCount;
    } catch (IndexOutOfBoundsException ex) {
        throw new ConcurrentModificationException();
    }
}
```

### 6.2. fail-safe 机制

fail-safe 表示安全失败，采用安全失败机制的集合在遍历集合中的元素时不是直接在原有集合上进行访问，而是先复制原集合中的内容，在拷贝的集合上去进行遍历。由于迭代器是对原集合的拷贝进行遍历，所以在遍历过程中对原集合的修改并不能被迭代器所检测到，所以也就不会抛出 `ConcurrentModificationException` 异常。类似如下这种情况：

```java
public class Test6 {
    public static void main(String[] args) {
        List<Integer> list = new CopyOnWriteArrayList<>(new Integer[]{1, 7, 9, 11});
        Iterator<Integer> iterator = list.iterator();
        while (iterator.hasNext()) {
            Integer i = iterator.next();
            System.out.println(i);
            if (i == 7) {
                // 在fail-safe模式下，这里不会被打印
                list.add(15);
            }
        }
    }
}
```

此处定义了一个 `CopyOnWriteArrayList` 集合， 使用 `Iterator` 迭代器对集合中的数据进行遍历，而在遍历的过程中，向集合中添加了一个新的元素，它并不会抛出异常，同时也不会打印出新添加的元素信息，输出结果如下所示：

```java
1
7
9
11
```

如上这种情况就叫 fail-safe 机制，在 `java.util.concurrent` 包下的集合类都是属于安全失败机制的，可以用在多线程环境下的并发修改，常见的使用这样一种机制的集合有 `CopyOnWriteArrayList` 和 `ConcurrentHashMap` 等等。

## 7. 关于 CopyOnWriteArrayList 了解多少？