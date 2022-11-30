---
title: HashMap 源码分析
tags: 
  - 集合
  - 源码
created: 2022-11-27 09:05:38
modified: 2022-11-27 09:07:44
number headings: auto, first-level 1, max 6, _.1.1.
---

# HashMap 源码分析

## 1. 整体结构

HashMap 底层的数据结构主要是：`数组 + 链表 + 红黑树 `。其中，在添加元素时，当链表的长度大于等于 8 并且数组的长度大于 64 时，链表会转化为红黑树；而在删除元素时，当红黑树的节点个数小于等于 6 时，红黑树会重新转化为链表。

![HashMap 数据结构.excalidraw](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270906927.svg)

## 2. 重要属性

```java
// 初始容量
static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;

// 最大容量
static final int MAXIMUM_CAPACITY = 1 << 30;

// 负载因子默认值
static final float DEFAULT_LOAD_FACTOR = 0.75f;

// bin(桶)容量大于等于8时，链表转化成红黑树
static final int TREEIFY_THRESHOLD = 8;

// bin(桶)容量小于等于6时，红黑树转化成链表
static final int UNTREEIFY_THRESHOLD = 6;

// 数组容量最小64时才会转会成红黑树
static final int MIN_TREEIFY_CAPACITY = 64;

// 用于fail-fast的，记录HashMap结构发生变化(数量变化或rehash)的数目
transient int modCount;

// HashMap 的实际大小，可能不准(因为当你拿到这个值的时候，可能又发生了变化)
transient int size;

// 扩容的门槛，如果初始化时，给定了数组的大小的话，会通过 tableSizeFor 方法计算，得到一个接近于 2 的幂次方的数组大小
// 如果是通过 resize 方法进行扩容后，大小 = 数组容量 * 0.75
int threshold;

// 存放数据的数组
transient Node<K,V>[] table;

// bin node 节点
static class Node<K,V> implements Map.Entry<K,V> {  
    final int hash; // key的hash值 
    final K key; // key值   
    V value; // value值  
    Node<K,V> next; // 当前节点的下一个节点
    
//红黑树的节点
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {  
    TreeNode<K,V> parent; // 当前节点的父节点  
    TreeNode<K,V> left; // 当前节点的左节点
    TreeNode<K,V> right; // 当前节点的右节点  
    TreeNode<K,V> prev; // 当前节点在双向链表中的上一个节点
    boolean red; // 当前节点的颜色(红/黑)
```

## 3. 初始化

在构造函数中并没有对 `table` 进行初始化，而是在第一次调用 `put()` 方法添加元素的时候才会对 `table` 进行初始化，这样设计主要是为了 **懒初始化，避免内存的浪费**，因为有可能初始化了之后如果没有向其中添加元素，这样会造成不必要的浪费。

```java
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " + initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " + loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}
```

在该构造函数中，唯一值得深扒的是 `this.threshold = tableSizeFor(initialCapacity);` 这一行代码，将通过 `tableSizeFor()` 方法确定出来的容量大小 `capacity` 却赋值给 `threshold`，一开始还以为是一个 `bug` 呢！正常的阈值计算公式不应该是 `this.threshold = tableSizeFor(initialCapacity) * loadFactor;` 吗？这样设计是为什么呢？如上面所说，为了 **懒初始化，避免内存的浪费**，如果是该构造函数这种情况，在 `put()` 方法中进行初始化 `table` 的时候会将在该构造函数中计算出来的 `threshold` 会被当作 `capacity`，然后利用正常的阈值计算公式重新去计算 `threshold` 的值。

#### 3.1.1. 寻找 2 的幂次方最小值

🤔：当咱们在初始化 `HashMap` 的时候，如果传入的 `initialCapacity` 的值为 17，此时 `HashMap` 会怎么处理呢？

🤓：答案就在 `tableSizeFor()` 方法中，找到比初始值大的并且最小的 2 的幂次方，保证数组的容量必须满足 `2^N` 的要求。如果传入的是 17，则结果应该是 32，2^4^=16 < 17，所以找到的是 2^5^=32。

```java
static final int tableSizeFor(int cap) {
    int n = cap - 1;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```

乍一看这个方法可能有点晕😵，怎么都是向右移位 1、2、4、8、16，这主要是为了把二进制的各个位置都填上 1，当二进制的各个位置都是 1 以后，就是一个标准的 2 的幂次方减 1 了，最后把结果加 1 之后再返回即可。

在这里咱们用一张图把该方法的整个计算过程展示出来，方便理解：

![image-20221128133757197](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211281337253.png)

`int n = cap - 1;` 至于为什么要对 `cap` 做减 1 操作，这是为了防止 `cap` 已经是 2 的幂次方值时，如果没有执行这个减 1 的操作，则执行完后面的几次无符号右移操作之后再执行 `n + 1`，返回的 `capacity` 将会是这个 `cap` 的 2 倍。

#### 3.1.2. 负载因子

```java
/**
 * The load factor used when none specified in constructor.
 */
static final float DEFAULT_LOAD_FACTOR = 0.75f;
```

在 `HashMap` 中，负载因子决定了元素个数到了多少之后会进行扩容。在添加元素的时候，可能会出现即使你要添加的元素个数比数组容量大也不一定正正好的把数组占满，而是在某些下标位置出现大量的碰撞，只能在同一个位置用链表存放，那么这样就失去了 `Map` 数组的性能。

所以，要选择在一个合理的大小下进行扩容，默认值 0.75 就是说当元素个数占了容量的 3/4 时赶紧扩容，减少 hash 碰撞。同时 0.75 是一个默认值，可以进行调整，如果你希望用更多的空间换时间，可以把负载因子调的小一些，减少碰撞。

那么，为什么会选择 0.75 呢？为什么不是其他数？背后有什么考虑？在源码中有这样一段描述：

```java
/**
As a general rule, the default load factor (.75) offers a good tradeoff between time and space costs. Higher values decrease the space overhead but increase the lookup cost (reflected in most of the operations of the HashMap class, including get and put). The expected number of entries in the map and its load factor should be taken into account when setting its initial capacity, so as to minimize the number of rehash operations. If the initial capacity is greater than the maximum number of entries divided by the load factor, no rehash operations will ever occur.
**/
```

翻译过来大致意思是：通常，默认负载因子（.75）在时间和空间成本之间提供了一个很好的折中方案。较高的值虽然会减少空间开销，但会增加查找成本（在 `HashMap` 类的大多数操作中都得到体现，包括 `get` 和 `put`）。设置映射表的初始容量时，应考虑映射中的预期条目数及其负载因子，以最大程度地减少重新哈希操作的数量。如果初始容量大于最大条目数除以负载因子，则将不会进行任何哈希操作。

通俗点来说就是，当负载因子过大时，虽然会减少空间开销，但是会存在很高的哈希碰撞的概率，会大大降低查询和添加元素的速度；如果当负载因子过小时，那么将会频繁扩容，大大浪费内存空间。所以，0.75 这个值是非常考究的。

## 4. 扰动函数

```java
static final int hash(Object key) {  
    int h;  
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);  
}
```

在扰动函数中，哈希值等于将 `key` 的哈希值无符号右移 16 位后（高位全部补 0）与原哈希值本身进行按位异或运算。也就是让低 16 位与高 16 位进行异或，高 16 位保持不变 (与 0 异或都是自己本身)，让高位也得以参与散列运算。说白了，使用扰动函数就是为了增加随机性，使得散列更加均匀，减少碰撞。

## 5. 数组下标

数组下标 `index ` 如何确定？使用 `(n-1) & hash`，其中 `n` 为数组长度，如默认的初始化容量为 16，即数组长度 n = 16，那么 n - 1 = 15，换算成二进制为 00001111，那么 (n-1)&hash 取的是 hash 值的低四位，4 个 bit 位的最大值为 15，所以往数组中存放元素时的数组下标就可以使用该方式进行确定。  
![](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270906773.png)

## 6. 数组扩容

在 `HashMap ` 源码中，把数组的初始化操作也放到了扩容方法中，因而扩容方法源码主要分为两部分：**确定新的数组大小**、**迁移数据**。

```java
final Node<K,V>[] resize() {
	// 将原来的table交由oldTab保存
    Node<K,V>[] oldTab = table;
    // 获取原来的数组长度赋值给oldCap  
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    // 将原来的阈值大小threshold交由oldThr保存  
    int oldThr = threshold;
    // 创建变量 newCap->新的数组大小，newThr->新的阈值大小  
    int newCap, newThr = 0; 
    // 如果原来的数组长度大于0
    if (oldCap > 0) {
        // 如果原来的数组长度已经大于等于最大的数组长度(1<<30)
        if (oldCap >= MAXIMUM_CAPACITY) {
	        // 直接把阈值大小设置为最大整数2^31-1
            threshold = Integer.MAX_VALUE;
            // 返回原来的数组  
            return oldTab;  
        }  
        // oldCap<<1 => 将原来的数组大小*2 
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY && oldCap >= DEFAULT_INITIAL_CAPACITY) 
            // 将阈值也扩大1倍 <=> oldThr * 2
            newThr = oldThr << 1; 
    }
    // 当原来的阈值大于0但数组长度=0时，对应的情况就是使用带有指定数组长度和加载因子的构造器创建HashMap 
    else if (oldThr > 0) 
	    // 新的数组长度等于原来的阈值大小 
        newCap = oldThr;
    // 对应的情况是使用默认的构造器创建HashMap
    else { 
	    // 默认的数组大小为16
        newCap = DEFAULT_INITIAL_CAPACITY; 
        // 默认的阈值大小 = 16 * 0.75(加载因子) = 12 
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);  
    } 
    // 当新的阈值大小为0时，对应的情况就是使用带有指定数组长度和加载因子的构造器创建HashMap
    if (newThr == 0) {
        // 使用阀值公式计算新的阈值 = 新的容量 * 负载因子
        float ft = (float)newCap * loadFactor;  
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?  
                  (int)ft : Integer.MAX_VALUE);  
    } 
    // 将新的阈值大小赋值给threshold
    threshold = newThr;  
    @SuppressWarnings({"rawtypes","unchecked"})
    // 此时扩容已经完成，接下来的工作就是进行数据拷贝，将原数组中的数据迁移到新数组中
    // 创建新的数组，数组长度为上面计算出来的新的数组大小
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    // table指向新数组  
    table = newTab;  
    if (oldTab != null) { 
        // 遍历原数组
        for (int j = 0; j < oldCap; ++j) {  
            // 当前节点变量
            Node<K,V> e; 
            // 判断数组中该位置的元素是否为null，即判断原数组中该位置是否存在元素 
            if ((e = oldTab[j]) != null) { 
	            // 条件成立，说明原数组中该位置存在元素，则将原数组中该位置的元素清空 
                oldTab[j] = null;
                // 判断当前元素是否有下一个节点，即判断该位置是否存在链表，如果为null，则表示当前位置只存在一个元素，所以只需要计算该元素位于新数组中的数组下标即可
                if (e.next == null) 
	                // 那么再次使用 hash & (n - 1) 来计算当前元素位于新数组中的数组下标，在新数组的该位置存放当前节点
                    newTab[e.hash & (newCap - 1)] = e;  
                // 该节点存在下一个节点，所以有可能是链表或者红黑树结构
                else if (e instanceof TreeNode)
                    // 判断当前节点是不是树节点，即判断当前位置是否已经转化为红黑树结构
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap); 
                // 表明该节点是一个链表结构
                else { 
	                // 新的位置只有两种可能：原位置 或者 原位置+原数组长度
	                // 把原链表拆成两个链表，然后再分别插入到新数组的两个位置上
	                // loXXX表示数组下标位置不变的链表，低位链表  
                    Node<K,V> loHead = null, loTail = null;
                    // hiXXX表示原数组下标+原数组长度的位置处的链表，高位链表  
                    Node<K,V> hiHead = null, hiTail = null;
                    // next节点，用于递归该位置的链表  
                    Node<K,V> next;  
                    do {  
	                    // next节点指向当前节点的下一个节点
                        next = e.next;
                        // 使用hash & 原数组长度(如16 = 10000)，如果最高位为0，表示该节点位于原位置，即存在于低位链表中
                        if ((e.hash & oldCap) == 0) {
                            // 判断低位链表的尾节点是否为null，如果为null，表示当前低位链表还没有节点，则将低位链表的头节点指向当前节点
                            if (loTail == null) 
                                // 将低位链表的头节点指向当前节点，作为该链表的第一个节点  
                                loHead = e;
                            // 如果不为null，则让低位链表的尾节点的下一个节点指向当前节点，即将整个低位链表串起来
                            else 
                                loTail.next = e;
                            // 最后让低位链表的尾节点指向当前节点，即移动低位链表的尾节点
                            loTail = e;   
                        }  
                        else {  
                            if (hiTail == null)  
                                hiHead = e;  
                            else  
                                hiTail.next = e;  
                            hiTail = e;  
                        }  
                    } while ((e = next) != null); // 递归当前链表直至结束
                    // 如果低位链表不为空
                    if (loTail != null) { 
	                    // 将低位链表的尾节点的下一个节点清空  
                        loTail.next = null;
                        // 在新数组的原位置处放入低位链表  
                        newTab[j] = loHead;  
                    }  
                    // 如果高位链表不为空 
                    if (hiTail != null) { 
	                    // 将高位链表的尾节点的下一个节点清空
                        hiTail.next = null;
                        // 在新数组的原位置+原来数组长度大小处放入高位链表   
                        newTab[j + oldCap] = hiHead;  
                    }  
                }  
            }  
        }  
    } 
    // 返回新的数组 
    return newTab;  
}
```

详细说明一下节点在扩容时位于 `原位置` 还是 `原位置+原来数组长度的位置`，这个结论是怎么来的？以及 HashMap 源码是如何来判断的？  
首先看下下面这张图，图 `a` 表示扩容前 `key1` 和 `key2` 确定数组下标的位置，图 `b` 表示扩容后 `key1` 和 `key2` 确定数组下标的位置。  
![扩容前后元素数组下标确定示意图 | 800](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270906171.png)  
数组在扩容后，因为数组长度 `n` 变为原来的 2 倍，即 `n - 1` 就会比原来在高位处多 1 个 bit 位，因此新的数组下标就会发生这样的变化：  
![扩容前后元素数组下标确定示意图 2 | 800](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270906699.png)  
所以在扩容时，只需要看 hash 值在原数组长度所对应二进制的最高位的位置是 0 还是 1，如果是 0 的话表示还是位于原位置，是 1 的话则表示当前节点所在新数组的位置=原位置 + 原来的数组长度。

## 7. 添加元素

### 7.1. 流程

![hashmap-put](https://fastly.jsdelivr.net/gh/xihuanxiaorang/images/202211270906397.svg)

### 7.2. 源码分析

```java
// 参数onlyIfAbsent表示是否覆盖原来的值，true表示不覆盖，false表示覆盖，默认为false
final V putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict) {
	// tab是存放节点的数组，n是数组长度,i是当前要插入的节点在数组中的下标，p是当前数组下标处的节点
    Node<K,V>[] tab; Node<K,V> p; int n, i; 
    // tab指向全局的table数组，判断tab是否为null或者tab的长度为0
    if ((tab = table) == null || (n = tab.length) == 0) 
	    // 条件成立，表示table数组还没有被初始化，此时添加的元素为集合中的第一个元素，调用resize扩容方法初始化tab或者给tab扩容
        n = (tab = resize()).length; 
    // hash & (n-1) => 当前要插入元素在数组中的数组下标index，p指向数组当前位置的元素，判断数组当前位置是否存在元素 
    if ((p = tab[i = (n - 1) & hash]) == null)  
		// 条件成立，表明数组当前位置没有元素，则直接在当前位置插入元素
        tab[i] = newNode(hash, key, value, null);  
    // 数组当前位置存在节点
    else { 
	    // e指向数组当前位置处已有的元素
        Node<K,V> e; K k;
        // 判断当前要插入元素的hash值和key值是否与当前位置处已有元素的hash值和key值相同
        if (p.hash == hash && ((k = p.key) == key || (key != null && key.equals(k)))) 
            // 条件成立，表示当前要插入的元素与当前位置处已有元素是同一个元素  
            e = p;  
        // 判断该元素是否为红黑树节点
        else if (p instanceof TreeNode) 
	        // 如果是的话，则使用红黑树的方法插入元素  
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // 最后一种情况，在当前位置处的链表中插入元素
        else {  
            // 遍历数组当前位置处的链表，此时p节点为数组当前位置处的第一个元素
            for (int binCount = 0; ; ++binCount) {  
	            // e指向p的下一个节点，在循环体的最后又将p指向e，如此这般可以用来遍历当前链表
                // 判断p节点的下一个节点是否为null
                if ((e = p.next) == null) { 
	                // 条件成立，表明p节点没有下一个节点，即p节点为最后一个节点，则直接将要插入的节点挂在p节点后面  
                    p.next = newNode(hash, key, value, null);
                    // 判断当前链表长度已经大于等于8个
                    if (binCount >= TREEIFY_THRESHOLD - 1) 
	                    // 在treeifyBin方法中还会继续判断数组长度是否小于64
	                    // 如果小于的话，则优先进行扩容而不是树化；如果数组长度大于等于64，才会将链表转化为红黑树结构
                        treeifyBin(tab, hash);
                    // 跳出循环，停止链表遍历  
                    break;  
                } 
                // 判断当前要插入元素的hash值和key值是否与正在遍历的链表中的e节点的hash值和key值相同
                if (e.hash == hash && ((k = e.key) == key || (key != null && key.equals(k)))) 
                    // 条件成立，表明要插入的元素与e节点是同一个元素，则不执行插入操作，跳出循环，停止链表遍历 
                    break;
                p = e;  
            }  
        }
        // 判断e是否为null，如果不为null，表明在当前链表中找到了与要插入元素的key相同的节点
        if (e != null) { 
	        // 取出e节点的value值赋值给oldValue  
            V oldValue = e.value;
            // 判断onlyIfAbsent是否为false或者原来的值是否为null
            if (!onlyIfAbsent || oldValue == null)  
	            // 条件成立，表明onlyIfAbsent为false或者原来的值为null，则用要插入元素的value值覆盖掉原来的值 
                e.value = value;  
            afterNodeAccess(e);
            // 返回原来的值  
            return oldValue;  
        }  
    }
    // modCount+1表示HashMap此时结构已经发生变化  
    ++modCount;
    // 判断节点数量是否已经大于阈值，不管是在数组上添加一个元素还是在链表中添加一个元素，size都会加1
    if (++size > threshold) 
	    // 如果大于的话，则调用resize方法进行扩容操作   
        resize();  
    afterNodeInsertion(evict);
    // 当前要插入的节点是一个新的节点，在原来的数组+链表+红黑树中不存在，当然原来的值也就不存在，返回null  
    return null;  
}
```

## 8. 红黑树

> 关于 [红黑树](../../../数据结构与算法/数据结构/红黑树.md) 的详细绍可以查看这一篇文章。  

### 8.1. 链表树化

```java
// tab是当前存放集合数据的数组，hash是要插入节点的key所对应的hash值
final void treeifyBin(Node<K,V>[] tab, int hash) {
	// n是数组长度，index是要插入节点在数组中的数组下标，e指向遍历链表时的节点
    int n, index; Node<K,V> e;
    // 判断tab是否为空或者tab的长度小于最小树化容量64
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY) 
	    // 如果tab为空或者数组的长度小于64，则先不进行树化而是扩容  
        resize();
    // hash & (n-1) => 当前要插入节点在数组中的数组下标index，e指向数组中当前位置的节点，判断当前位置是否存在节点
    else if ((e = tab[index = (n - 1) & hash]) != null) { 
	    // 满足当前数组下标位置处存在节点
	    // hd是头节点，tl是尾节点
        TreeNode<K,V> hd = null, tl = null; 
        // 循环遍历链表，其实循环体中的代码就是将链表中的节点转化为红黑树节点并且形成一个双向链表的结构 
        do {
            TreeNode<K,V> p = replacementTreeNode(e, null);
	            // 头节点指向链表中的第一个节点  
                hd = p;   
            else {
                p.prev = tl;  
                tl.next = p;  
            }  
            // 尾节点指向当前正在遍历的节点
            tl = p;  
        } while ((e = e.next) != null);
        // 将上面形成的双向链表结构放在当前数组下标位置处的数组中，并且判断头节点是否不为null
        if ((tab[index] = hd) != null)  
	        // 执行TreeNode中treeify方法将链表转化为真正的红黑树结构
            hd.treeify(tab);  
    }  
}
```

### 8.2. 待完善知识点

- [ ] 红黑树添加节点
- [ ] 左旋
- [ ] 右旋

