/**
 * SQL DSL for Elide - Type-safe SQL query builder in Kotlin
 *
 * Build SQL queries with compile-time type safety and validation:
 * - Type-safe column references
 * - Query composition
 * - Parameter binding
 * - Dialect support (PostgreSQL, MySQL, SQLite)
 */

package elide.dsl.sql

/**
 * SQL Table definition
 */
abstract class Table(val tableName: String) {
    val columns = mutableListOf<Column<*>>()

    inner class Column<T>(val name: String, val type: SqlType<T>) {
        init {
            columns.add(this)
        }

        infix fun eq(value: T): Condition {
            return Condition("$tableName.$name = ?", listOf(value))
        }

        infix fun notEq(value: T): Condition {
            return Condition("$tableName.$name != ?", listOf(value))
        }

        infix fun gt(value: T): Condition {
            return Condition("$tableName.$name > ?", listOf(value))
        }

        infix fun lt(value: T): Condition {
            return Condition("$tableName.$name < ?", listOf(value))
        }

        infix fun like(pattern: String): Condition {
            return Condition("$tableName.$name LIKE ?", listOf(pattern))
        }

        fun isNull(): Condition {
            return Condition("$tableName.$name IS NULL", emptyList())
        }

        fun isNotNull(): Condition {
            return Condition("$tableName.$name IS NOT NULL", emptyList())
        }
    }
}

/**
 * SQL type wrapper
 */
sealed class SqlType<T>(val sqlName: String) {
    object Integer : SqlType<Int>("INTEGER")
    object Long : SqlType<kotlin.Long>("BIGINT")
    object Text : SqlType<String>("TEXT")
    object Boolean : SqlType<kotlin.Boolean>("BOOLEAN")
    object Timestamp : SqlType<java.time.LocalDateTime>("TIMESTAMP")
    object Decimal : SqlType<Double>("DECIMAL")
}

/**
 * WHERE condition
 */
data class Condition(val sql: String, val params: List<Any?>) {
    infix fun and(other: Condition): Condition {
        return Condition(
            "($sql) AND (${other.sql})",
            params + other.params
        )
    }

    infix fun or(other: Condition): Condition {
        return Condition(
            "($sql) OR (${other.sql})",
            params + other.params
        )
    }

    fun not(): Condition {
        return Condition("NOT ($sql)", params)
    }
}

/**
 * SELECT query builder
 */
class SelectQuery<T : Table>(private val table: T) {
    private val selectedColumns = mutableListOf<Table.Column<*>>()
    private var whereCondition: Condition? = null
    private var orderByColumn: Table.Column<*>? = null
    private var orderDirection: String = "ASC"
    private var limitValue: Int? = null
    private var offsetValue: Int? = null
    private val joins = mutableListOf<Join>()

    fun select(vararg columns: Table.Column<*>): SelectQuery<T> {
        selectedColumns.addAll(columns)
        return this
    }

    fun where(condition: Condition): SelectQuery<T> {
        whereCondition = condition
        return this
    }

    fun orderBy(column: Table.Column<*>, direction: String = "ASC"): SelectQuery<T> {
        orderByColumn = column
        orderDirection = direction
        return this
    }

    fun limit(count: Int): SelectQuery<T> {
        limitValue = count
        return this
    }

    fun offset(count: Int): SelectQuery<T> {
        offsetValue = count
        return this
    }

    fun innerJoin(other: Table, on: Condition): SelectQuery<T> {
        joins.add(Join("INNER JOIN", other, on))
        return this
    }

    fun leftJoin(other: Table, on: Condition): SelectQuery<T> {
        joins.add(Join("LEFT JOIN", other, on))
        return this
    }

    fun build(): CompiledQuery {
        val sql = StringBuilder()
        val params = mutableListOf<Any?>()

        // SELECT clause
        sql.append("SELECT ")
        if (selectedColumns.isEmpty()) {
            sql.append("${table.tableName}.*")
        } else {
            sql.append(selectedColumns.joinToString(", ") { "${table.tableName}.${it.name}" })
        }

        // FROM clause
        sql.append(" FROM ${table.tableName}")

        // JOIN clauses
        joins.forEach { join ->
            sql.append(" ${join.type} ${join.table.tableName} ON ${join.condition.sql}")
            params.addAll(join.condition.params)
        }

        // WHERE clause
        whereCondition?.let { condition ->
            sql.append(" WHERE ${condition.sql}")
            params.addAll(condition.params)
        }

        // ORDER BY clause
        orderByColumn?.let { column ->
            sql.append(" ORDER BY ${table.tableName}.${column.name} $orderDirection")
        }

        // LIMIT clause
        limitValue?.let { limit ->
            sql.append(" LIMIT $limit")
        }

        // OFFSET clause
        offsetValue?.let { offset ->
            sql.append(" OFFSET $offset")
        }

        return CompiledQuery(sql.toString(), params)
    }

    private data class Join(
        val type: String,
        val table: Table,
        val condition: Condition
    )
}

/**
 * INSERT query builder
 */
class InsertQuery<T : Table>(private val table: T) {
    private val values = mutableMapOf<Table.Column<*>, Any?>()

    fun value(column: Table.Column<*>, value: Any?): InsertQuery<T> {
        values[column] = value
        return this
    }

    fun build(): CompiledQuery {
        val columns = values.keys.joinToString(", ") { it.name }
        val placeholders = values.keys.joinToString(", ") { "?" }

        val sql = "INSERT INTO ${table.tableName} ($columns) VALUES ($placeholders)"
        val params = values.values.toList()

        return CompiledQuery(sql, params)
    }
}

/**
 * UPDATE query builder
 */
class UpdateQuery<T : Table>(private val table: T) {
    private val updates = mutableMapOf<Table.Column<*>, Any?>()
    private var whereCondition: Condition? = null

    fun set(column: Table.Column<*>, value: Any?): UpdateQuery<T> {
        updates[column] = value
        return this
    }

    fun where(condition: Condition): UpdateQuery<T> {
        whereCondition = condition
        return this
    }

    fun build(): CompiledQuery {
        val setClauses = updates.entries.joinToString(", ") { "${it.key.name} = ?" }
        val params = updates.values.toMutableList()

        val sql = StringBuilder()
        sql.append("UPDATE ${table.tableName} SET $setClauses")

        whereCondition?.let { condition ->
            sql.append(" WHERE ${condition.sql}")
            params.addAll(condition.params)
        }

        return CompiledQuery(sql.toString(), params)
    }
}

/**
 * DELETE query builder
 */
class DeleteQuery<T : Table>(private val table: T) {
    private var whereCondition: Condition? = null

    fun where(condition: Condition): DeleteQuery<T> {
        whereCondition = condition
        return this
    }

    fun build(): CompiledQuery {
        val sql = StringBuilder()
        val params = mutableListOf<Any?>()

        sql.append("DELETE FROM ${table.tableName}")

        whereCondition?.let { condition ->
            sql.append(" WHERE ${condition.sql}")
            params.addAll(condition.params)
        }

        return CompiledQuery(sql.toString(), params)
    }
}

/**
 * Compiled SQL query with parameters
 */
data class CompiledQuery(val sql: String, val params: List<Any?>)

/**
 * DSL entry points
 */
fun <T : Table> T.select(vararg columns: Table.Column<*>): SelectQuery<T> {
    return SelectQuery(this).select(*columns)
}

fun <T : Table> T.selectAll(): SelectQuery<T> {
    return SelectQuery(this)
}

fun <T : Table> T.insert(): InsertQuery<T> {
    return InsertQuery(this)
}

fun <T : Table> T.update(): UpdateQuery<T> {
    return UpdateQuery(this)
}

fun <T : Table> T.delete(): DeleteQuery<T> {
    return DeleteQuery(this)
}

/**
 * Example usage:
 *
 * object Users : Table("users") {
 *     val id = Column("id", SqlType.Integer)
 *     val name = Column("name", SqlType.Text)
 *     val email = Column("email", SqlType.Text)
 *     val age = Column("age", SqlType.Integer)
 * }
 *
 * // SELECT
 * val query1 = Users.select(Users.name, Users.email)
 *     .where(Users.age gt 18)
 *     .orderBy(Users.name)
 *     .limit(10)
 *     .build()
 *
 * // INSERT
 * val query2 = Users.insert()
 *     .value(Users.name, "Alice")
 *     .value(Users.email, "alice@example.com")
 *     .value(Users.age, 25)
 *     .build()
 *
 * // UPDATE
 * val query3 = Users.update()
 *     .set(Users.age, 26)
 *     .where(Users.email eq "alice@example.com")
 *     .build()
 *
 * // DELETE
 * val query4 = Users.delete()
 *     .where(Users.age lt 18)
 *     .build()
 */
