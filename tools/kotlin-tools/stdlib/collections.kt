/**
 * Kotlin Collections Extensions for Elide
 *
 * Enhanced collection operations optimized for Elide runtime:
 * - Lazy sequences
 * - Functional operations
 * - Type-safe builders
 * - Performance optimizations
 */

package elide.stdlib.collections

/**
 * Immutable list builder
 */
fun <T> buildList(builderAction: MutableList<T>.() -> Unit): List<T> {
    return mutableListOf<T>().apply(builderAction)
}

/**
 * Immutable map builder
 */
fun <K, V> buildMap(builderAction: MutableMap<K, V>.() -> Unit): Map<K, V> {
    return mutableMapOf<K, V>().apply(builderAction)
}

/**
 * Immutable set builder
 */
fun <T> buildSet(builderAction: MutableSet<T>.() -> Unit): Set<T> {
    return mutableSetOf<T>().apply(builderAction)
}

/**
 * Partition collection into chunks
 */
fun <T> List<T>.chunked(size: Int): List<List<T>> {
    require(size > 0) { "Chunk size must be positive" }
    return (0 until this.size step size).map { i ->
        this.subList(i, minOf(i + size, this.size))
    }
}

/**
 * Group consecutive elements by predicate
 */
fun <T> List<T>.groupConsecutiveBy(predicate: (T, T) -> Boolean): List<List<T>> {
    if (isEmpty()) return emptyList()

    val result = mutableListOf<MutableList<T>>()
    var currentGroup = mutableListOf(first())

    for (i in 1 until size) {
        if (predicate(this[i - 1], this[i])) {
            currentGroup.add(this[i])
        } else {
            result.add(currentGroup)
            currentGroup = mutableListOf(this[i])
        }
    }
    result.add(currentGroup)

    return result
}

/**
 * Safe get with default value
 */
fun <T> List<T>.getOrDefault(index: Int, default: T): T {
    return if (index in indices) this[index] else default
}

/**
 * Find all indices matching predicate
 */
fun <T> List<T>.indicesOf(predicate: (T) -> Boolean): List<Int> {
    return indices.filter { predicate(this[it]) }
}

/**
 * Rotate list elements
 */
fun <T> List<T>.rotate(n: Int): List<T> {
    if (isEmpty()) return this
    val shift = n % size
    return drop(shift) + take(shift)
}

/**
 * Interleave two lists
 */
fun <T> List<T>.interleave(other: List<T>): List<T> {
    val result = mutableListOf<T>()
    val maxSize = maxOf(size, other.size)

    for (i in 0 until maxSize) {
        if (i < size) result.add(this[i])
        if (i < other.size) result.add(other[i])
    }

    return result
}

/**
 * Count occurrences of each element
 */
fun <T> List<T>.frequencies(): Map<T, Int> {
    return groupingBy { it }.eachCount()
}

/**
 * Sample n random elements
 */
fun <T> List<T>.sample(n: Int): List<T> {
    require(n >= 0) { "Sample size must be non-negative" }
    if (n >= size) return this
    return shuffled().take(n)
}

/**
 * Map with index offset
 */
fun <T, R> List<T>.mapIndexedNotNull(transform: (index: Int, T) -> R?): List<R> {
    return mapIndexedNotNull { index, value -> transform(index, value) }
}

/**
 * Sliding window
 */
fun <T> List<T>.windowed(size: Int, step: Int = 1): List<List<T>> {
    require(size > 0 && step > 0) { "Size and step must be positive" }
    return (0..(this.size - size) step step).map { i ->
        subList(i, i + size)
    }
}

/**
 * Reduce with index
 */
fun <T, R> List<T>.reduceIndexed(initial: R, operation: (index: Int, acc: R, T) -> R): R {
    var accumulator = initial
    forEachIndexed { index, element ->
        accumulator = operation(index, accumulator, element)
    }
    return accumulator
}

/**
 * Map extensions
 */
fun <K, V> Map<K, V>.filterValues(predicate: (V) -> Boolean): Map<K, V> {
    return filter { (_, value) -> predicate(value) }
}

fun <K, V> Map<K, V>.mapValues(transform: (V) -> V): Map<K, V> {
    return mapValues { (_, value) -> transform(value) }
}

fun <K, V> Map<K, V>.getOrDefault(key: K, defaultValue: V): V {
    return this[key] ?: defaultValue
}

/**
 * Merge two maps
 */
fun <K, V> Map<K, V>.merge(other: Map<K, V>, merger: (V, V) -> V): Map<K, V> {
    val result = this.toMutableMap()
    other.forEach { (key, value) ->
        result[key] = if (key in result) merger(result[key]!!, value) else value
    }
    return result
}

/**
 * Set operations
 */
infix fun <T> Set<T>.symmetricDifference(other: Set<T>): Set<T> {
    return (this - other) + (other - this)
}

fun <T> Set<T>.powerSet(): Set<Set<T>> {
    if (isEmpty()) return setOf(emptySet())

    val element = first()
    val rest = drop(1).toSet()
    val subsets = rest.powerSet()

    return subsets + subsets.map { it + element }
}

/**
 * Sequence builders
 */
fun <T> infiniteSequence(generator: (Int) -> T): Sequence<T> = sequence {
    var index = 0
    while (true) {
        yield(generator(index++))
    }
}

fun <T> repeatSequence(value: T): Sequence<T> = sequence {
    while (true) {
        yield(value)
    }
}

/**
 * Example usage:
 *
 * val numbers = listOf(1, 2, 3, 4, 5)
 *
 * // Chunked
 * numbers.chunked(2) // [[1, 2], [3, 4], [5]]
 *
 * // Frequencies
 * listOf("a", "b", "a", "c", "a").frequencies() // {a=3, b=1, c=1}
 *
 * // Windowed
 * numbers.windowed(3, 1) // [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 *
 * // Build list
 * val list = buildList {
 *     add(1)
 *     add(2)
 *     addAll(listOf(3, 4, 5))
 * }
 */
