---
title: LinkedList 源码分析
tags: 
  - 集合
  - 源码
created: 2022-11-25 14:11:58
modified: 2022-11-25 14:11:58
number headings: auto, first-level 1, max 6, _.1.1.
---

# LinkedList 源码分析

> 对于链表数据结构有不了解的小伙伴建议先阅读 [链表](../../数据结构与算法/数据结构/线性表/链表.md) 这一篇文章。

## 1. 底层实现

<img src="https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270202972.png" alt="img" style="width: 400px;" />

`LinkedList` 实现了 `List` 接口，继承自 `AbstractSequentialList` 抽象类。底层是 **基于双向链表实现** 的。它还实现了 `Deque` 接口，因此可以被当作堆栈（`Stack`）、队列（`Queue`）或双端队列（`Deque`）进行操作。关于栈和队列，现在首选使用 `ArrayDeque`，它有着比 `LinkedList`（被当作栈或队列使用时）有着更好的性能。

![LinkedList数据结构](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270224996.png)



```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable
{
    transient int size = 0;
    transient Node<E> first;
    transient Node<E> last;
}
```

`LinkedList` 内部定义了一个 `Node` 节点，它包含三个部分：**元素内容 `item`，前引用 `prev` 和后引用 `next`**。`LinkedList` 的每个节点用 `Node` 表示。`LinkedList` 通过 **头节点 `first` 和尾节点 `last` 分别指向链表中的第一个和最后一个元素**。注意这里没有所谓的哑元，当链表为空的时候头节点 `first` 和尾节点 `last` 都指向 `null`。`Node` 节点代码如下所示：

```java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;

    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

`LinkedList` 还实现了 `Cloneable` 接口，这表明 `LinkedList` 是支持拷贝的。

`LinkedList` 还实现了 `Serializable` 接口，这表明 `LinkedList` 是支持序列化的。眼睛尖的小伙伴可能又注意到了，`LinkedList` 中的关键字段 `size`、`first` 和 `last` 都使用 `transient` 关键字修饰，这不是又矛盾了吗？到底是想序列化还是不想序列化？

答案是 `LinkedList` 想按照自己的方法进行序列化操作。来看它自己实现的 `writeObject()` 方法：

```java
private void writeObject(java.io.ObjectOutputStream s)
    throws java.io.IOException {
    // Write out any hidden serialization magic
    s.defaultWriteObject();

    // Write out size
    s.writeInt(size);

    // Write out all elements in the proper order.
    for (Node<E> x = first; x != null; x = x.next)
        s.writeObject(x.item);
}
```

发现没？`LinkedList` 在序列化的时候只保留了元素的内容 `item`，并没有保留元素的前后引用。这样就节省了不少内存空间，对吧？那有些小伙伴可能就要问了，只保留元素内容，不保留前后引用的话，那反序列化的时候怎么办？

```java
private void readObject(java.io.ObjectInputStream s)
    throws java.io.IOException, ClassNotFoundException {
    // Read in any hidden serialization magic
    s.defaultReadObject();

    // Read in size
    int size = s.readInt();

    // Read in all elements in the proper order.
    for (int i = 0; i < size; i++)
        linkLast((E)s.readObject());
}

void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
```

注意 `for` 循环中的 `linkLast()` 方法，它可以把链表又重新链接起来，这样就恢复了链表序列化之前的顺序。

和 `ArrayList` 相比，`LinkedList` 没有实现 `RandomAccess` 接口，这是因为 `LinkedList` 存储数据的内存并不是连续的，所以不支持随机访问。

## 2. 初始化

与 `ArrayList` 不同，`LinkedList` 初始化不需要创建数组，因为它是一个链表结构。而且也没有传给构造函数初始化多少个空间的入参，例如这样是不可以的，如下：

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270258850.png)

**但是**，构造函数一样提供了和 `ArrayList` 一些相同的方式，来初始化入参，如下这四种方式：

```java
@Test
public void test_init() {
    // 初始化方式；普通方式
    LinkedList<String> list01 = new LinkedList<>();
    list01.add("a");
    list01.add("b");
    list01.add("c");
    System.out.println(list01);
    
    // 初始化方式；Arrays.asList
    LinkedList<String> list02 = new LinkedList<>(Arrays.asList("a", "b", "c"));
    System.out.println(list02);
    
    // 初始化方式；内部类
    LinkedList<String> list03 = new LinkedList<>()\\{
        {add("a");add("b");add("c");}
    \\};
    System.out.println(list03);
    
    // 初始化方式；Collections.nCopies
    LinkedList<Integer> list04 = new LinkedList<>(Collections.nCopies(10, 0));
    System.out.println(list04);
}

// 测试结果

[a, b, c]
[a, b, c]
[a, b, c]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

Process finished with exit code 0
```

- 这些方式都可以进行初始化操作，按需选择即可。

## 3. 插入

`LinkedList` 的插入方法比较多，`List` 接口中默认提供的是 `add()` 方法，也可以插入指定位置。但在 `LinkedList` 中还提供了 **头插 `addFirst()` 和尾插 `addLast()` 方法**。

### 3.1. 头插

先来看一张 `ArrayList` 和 `LinkedList` 在头部插入元素时的对比图，如下：

![插入对比](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270316630.png)

看上图咱们分析出以下几点：

1. `ArrayList` 头插时，需要将数组中的所有元素通过 `Arrays.copy()` 方法全部向后移动一位，如果容量不足的时候还需要进行扩容。
2. `LinkedList` 头插时，则不需要考虑扩容以及移位的问题，直接把元素定位到首位，拉点链条链接上即可。

#### 3.1.1. 源码

这里咱们再对照下 `LinkedList` 头插的源码，如下：

```java
private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    if (f == null)
        last = newNode;
    else
        f.prev = newNode;
    size++;
    modCount++;
}
```

- 创建临时节点 `f` 指向头节点 `first`，用于保存链表原来的头节点。
- 插入的时候会创建新的节点 `new Node<>(null, e, f)`，其 `prev` 指向 `null`，`next` 指向节点 `f`，即链表原来的头节点。紧接着让头节点 `first` 指向新创建的节点。
- 之后判断 `f` 节点是否存在，不存在的话说明当前要插入的节点为链表中唯一的一个节点，该节点即作为头节点也作为尾节点，所以尾节点 `last` 需要指向当前要插入的节点。否则的话原来的头节点 `f` 的 `prev` 需要指向现在新的头节点，即当前要插入的节点。
- 最后元素数量 `size` 和结构修改的次数 `modCount` 自增。其中，`modCount` 用在遍历时做校验 `modCount != expectedModCount`。

#### 3.1.2. 验证

**`ArrayList` 和 `LinkedList` 头插源码验证：**

```java
@Test
public void test_ArrayList_addFirst() {
    ArrayList<Integer> list = new ArrayList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10000000; i++) {
        // add(i) 则是尾插
        list.add(0, i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}

@Test
public void test_LinkedList_addFirst() {
    LinkedList<Integer> list = new LinkedList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10000000; i++) {
        list.addFirst(i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

**比对结果：**

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270358890.png)

- 这里咱们分别验证 10 万、100 万、1000 万的数据量，在头插时的一个耗时情况。
- 如咱们数据结构对比图中一样，`ArrayList` 需要做大量的移位和复制操作，而 `LinkedList` 的优势就体现出来了，耗时只是实例化一个对象。

### 3.2. 尾插

先来看一张 `ArrayList` 和 `LinkedList` 在尾部插入元素时的对比图，如下：

![插入对比](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270402616.png)

看上图咱们可以分析出以下几点：

1. `ArrayList` 尾插时，是不需要进行元素移位的，比较耗时的是当容量不足时需要进行扩容操作，将元素进行拷贝迁移。
2. `LinkedList` 尾插时，与头插相比耗时点会在对象的实例化上。

#### 3.2.1. 源码

这里咱们再对照下 `LinkedList` 尾插的源码，如下：

```java
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}
```

- 与头插代码几乎没有什么区别，只不过是将 `first` 换成 `last`。
- 耗时点只是在创建节点 `new Node<>(l, e, null);` 上。

#### 3.2.2. 验证

**`ArrayList` 和 `LinkedList` 尾插源码验证：**

```java
@Test
public void test_ArrayList_addLast() {
    ArrayList<Integer> list = new ArrayList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10000000; i++) {
        list.add(i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}

@Test
public void test_LinkedList_addLast() {
    LinkedList<Integer> list = new LinkedList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 1000000; i++) {
        list.addLast(i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

**比对结果：**

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270429733.png)

- 这里咱们分别验证 10 万、100 万、1000 万的数据量，在尾插时的一个耗时情况。
- 如咱们数据结构对比图中一样，`ArrayList` 不需要做移位拷贝也就不那么耗时了，而 `LinkedList` 则需要创建大量的对象。所以这里 `ArrayList` 尾插的效果要比 `LinkedList` 更好一些。

### 3.3. 中间插

先来看一张 `ArrayList` 和 `LinkedList` 在中间插入元素时的对比图，如下：

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270416996.png)

看上图咱们可以分析出以下几点：

1. `ArrayList` 在中间插入元素时，首先咱们知道它的定位时间复杂度为 O(1)，比较耗时的点在于容量不足时的扩容操作和数据迁移。
2. `LinkedList` 在中间插入元素时，链表的元素实际插入时并不会怎么耗时，但是它定位元素的时间复杂度为 O(n)，所以比较耗时的点在于定位元素位置以及元素的实例化。

#### 3.3.1. 源码

这里咱们再对照下 `LinkedList` 指定位置插入元素的源码，如下：

**使用 `add(index, element)` 方法插入元素：**

```java
public void add(int index, E element) {
    checkPositionIndex(index);
    if (index == size)
        linkLast(element);
    else
        linkBefore(element, node(index));
}
```

**位置定位 `node(index)`：**

```java
Node<E> node(int index) {
    // assert isElementIndex(index);
    if (index < (size >> 1)) {
        Node<E> x = first;
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

- `size >> 1`，这部分的代码用于判断元素位置是否在左半区间，还是右半区间。如果是左半区间，则从头节点开始往后找；如果是右半区间，则从尾节点开始往前找。

**执行插入：**

```java
void linkBefore(E e, Node<E> succ) {
    // assert succ != null;
    final Node<E> pred = succ.prev;
    final Node<E> newNode = new Node<>(pred, e, succ);
    succ.prev = newNode;
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}
```

- 找到元素要插入的位置之后，插入的过程就比较简单了，与头插和尾插相差不大。
- 整个过程可以看到，插入中比较耗时的点会在遍历寻找插入位置上。

#### 3.3.2. 验证

**`ArrayList` 和 `LinkedList` 中间插入源码验证：**

```java
@Test
public void test_ArrayList_addCenter() {
    ArrayList<Integer> list = new ArrayList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 10000000; i++) {
        list.add(list.size() >> 1, i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}

@Test
public void test_LinkedList_addCenter() {
    LinkedList<Integer> list = new LinkedList<>();
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < 1000000; i++) {
        list.add(list.size() >> 1, i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

**比对结果：**

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270430800.png)

- 这里咱们分别验证 10 万、100 万、1000 万的数据量，在中间插入时的一个耗时情况。
- 可以看到 `LinkedList` 在中间插入时，遍历寻找位置耗时非常耗时的。所以不同的情况下，需要选择不同的 `List` 集合做业务。

## 4. 删除

讲了这么多插入的操作后，删除的知识点就很好理解了。与 `ArrayList` 不同，删除元素不需要拷贝元素，`LinkedList` 是找到元素位置，把元素前后链接上。基本如下图：

![img](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211271005139.png)

- 确定出要删除的元素 `x`，把前后的链接进行替换。
- 如果是删除首尾元素，操作起来会更加容易，这也就是为什么说插入和删除快。但删除中间位置的元素，需要遍历链表找到元素对应的位置。

### 4.1. 删除操作方法

| 序号 | 方法                                     | 描述                                    |
| :--: | ---------------------------------------- | --------------------------------------- |
|  1   | list.remove();                           | 与 removeFirst() 一致                     |
|  2   | list.remove(1);                          | 删除 index=1 的位置元素节点，需要遍历定位 |
|  3   | list.remove("a");                        | 删除元素="a" 的节点，需要遍历定位        |
|  4   | list.removeFirst();                      | 删除头节点                              |
|  5   | list.removeLast();                       | 删除尾节点                              |
|  6   | list.removeAll(Arrays.asList("a", "b")); | 按照集合批量删除，底层是 Iterator 删除    |

```java
@Test
public void test_remove() {
    LinkedList<String> list = new LinkedList<String>();
    list.add("a");
    list.add("b");
    list.add("c");
    
    list.remove();
    list.remove(1);
    list.remove("a");
    list.removeFirst();
    list.removeLast();
    list.removeAll(Arrays.asList("a", "b"));
}
```

### 4.2. 源码

删除操作的源码都差不多，分为删除头尾节点和其他节点。这里咱们举例一个删除其他位置的源码进行学习，如下：

**list.remove("a");**

```java
public boolean remove(Object o) {
    if (o == null) {
        for (Node<E> x = first; x != null; x = x.next) {
            if (x.item == null) {
                unlink(x);
                return true;
            }
        }
    } else {
        for (Node<E> x = first; x != null; x = x.next) {
            if (o.equals(x.item)) {
                unlink(x);
                return true;
            }
        }
    }
    return false;
}
```

- 元素定位，判断要删除的节点是否为 `null`，如果为 `null` 的话，则使用 `==` 来判断两个元素的内存地址是否相等，否则的话使用 `equals()` 方法来判断。

**`unlink(x)` 解链**

```java
E unlink(Node<E> x) {
    // assert x != null;
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;
    
    if (prev == null) {
        first = next;
    } else {
        prev.next = next;
        x.prev = null;
    }
    
    if (next == null) {
        last = prev;
    } else {
        next.prev = prev;
        x.next = null;
    }
    
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

这部分源码主要有以下几个知识点：

1. 获取待删除节点的信息；元素 `item`、元素下一个节点 `next`、元素上一个节点 `prev`。
2. 如果待删除节点的上个节点 `prev` 为空（表明待删除节点的上个节点为头节点 `first`），则让头节点 `first` 指向待删除节点的下一个节点 `next`；否则的话让待删除节点的上个节点 `prev` 的 `next` 指向待删除节点的下一个节点 `next`。如果小伙伴们觉得困惑的话，可以画张图帮助自己理解。
3. 同样待删除节点的下一个节点 `next`，也执行步骤 2 同样操作。
4. 最后是把删除节点设置为 `null`，元素个数 `size` 自减，数据结构修改次数 `modCount` 自增。

## 5. 遍历

接下来说下遍历，`ArrayList` 与 `LinkedList` 的遍历都是通用的，基本包括 5 种方式。

这里咱们先初始化待遍历的集合，包含 1 千万数据：

```java
int xx = 0;
@Before
public void init() {
    for (int i = 0; i < 10000000; i++) {
        list.add(i);
    }
}
```

### 5.1. 普通 for 循环

```java
@Test
public void test_LinkedList_for0() {
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < list.size(); i++) {
        xx += list.get(i);
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

### 5.2. 增加 for 循环

```java
@Test
public void test_LinkedList_for1() {
    long startTime = System.currentTimeMillis();
    for (Integer itr : list) {
        xx += itr;
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

### 5.3. Iterator 遍历

```java
@Test
public void test_LinkedList_Iterator() {
    long startTime = System.currentTimeMillis();
    Iterator<Integer> iterator = list.iterator();
    while (iterator.hasNext()) {
        Integer next = iterator.next();
        xx += next;
    }
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime))
}
```

### 5.4. forEach 循环

```java
@Test
public void test_LinkedList_forEach() {
    long startTime = System.currentTimeMillis();
    list.forEach(integer -> {
        xx += integer;
    });
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

### 5.5. stream 流

```java
@Test
public void test_LinkedList_stream() {
    long startTime = System.currentTimeMillis();
    list.stream().forEach(integer -> {
        xx += integer;
    });
    System.out.println("耗时：" + (System.currentTimeMillis() - startTime));
}
```

## 6. 总结

- `ArrayList` 与 `LinkedList` 都有自己的使用场景，如果你不能很好的确定，那么就使用 `ArrayList`。但如果你能确定你在集合的首尾会有大量的插入、删除以及获取操作，那么可以使用 `LinkedList`，因为它都有相应的方法：`addFirst()`、`addLast()`、`removeFirst()`、`removeLast()`、`getFirst()`、`getLast()`，这些操作的时间复杂度都是 O(1)，非常高效。
- `LinkedList` 的链表结构不一定会比 `ArrayList` 节省空间，首先它所占用的内存不是连续的，其次它还需要大量的实例化对象创建节点。虽然不一定节省空间，但链表结构也是非常优秀的数据结构，它能在你的程序设计中起着非常优秀的作用，例如可视化的链路追踪图，就需要用到链表结构，并需要每个节点自旋一次，用于串联业务。
- 程序的精髓往往就是数据结构的设计，这能为你的程序开发提供出非常高的效率改变。