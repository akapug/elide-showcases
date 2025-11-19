/**
 * HTML DSL for Elide - Type-safe HTML generation in Kotlin
 *
 * A modern alternative to kotlinx.html, designed specifically for Elide:
 * - Zero dependencies
 * - Type-safe HTML construction
 * - Compile-time validation
 * - Fast rendering
 * - JSX-like syntax
 */

package elide.dsl.html

/**
 * Base HTML element
 */
abstract class HtmlElement(val tagName: String) {
    val attributes = mutableMapOf<String, String>()
    val children = mutableListOf<HtmlElement>()
    var textContent: String? = null

    fun attr(name: String, value: String) {
        attributes[name] = value
    }

    fun text(content: String) {
        textContent = content
    }

    fun render(): String {
        val sb = StringBuilder()
        sb.append("<$tagName")

        // Render attributes
        attributes.forEach { (name, value) ->
            sb.append(" $name=\"${escapeHtml(value)}\"")
        }

        if (children.isEmpty() && textContent == null && isSelfClosing()) {
            sb.append(" />")
        } else {
            sb.append(">")

            // Render text content
            textContent?.let { sb.append(escapeHtml(it)) }

            // Render children
            children.forEach { sb.append(it.render()) }

            sb.append("</$tagName>")
        }

        return sb.toString()
    }

    private fun isSelfClosing(): Boolean {
        return tagName in setOf("br", "hr", "img", "input", "meta", "link")
    }

    private fun escapeHtml(text: String): String {
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;")
    }
}

/**
 * HTML document root
 */
class Html : HtmlElement("html") {
    fun head(block: Head.() -> Unit) {
        val head = Head()
        head.block()
        children.add(head)
    }

    fun body(block: Body.() -> Unit) {
        val body = Body()
        body.block()
        children.add(body)
    }
}

/**
 * Head element
 */
class Head : HtmlElement("head") {
    fun title(text: String) {
        val title = Title()
        title.text(text)
        children.add(title)
    }

    fun meta(name: String, content: String) {
        val meta = Meta()
        meta.attr("name", name)
        meta.attr("content", content)
        children.add(meta)
    }

    fun link(rel: String, href: String, type: String? = null) {
        val link = Link()
        link.attr("rel", rel)
        link.attr("href", href)
        type?.let { link.attr("type", it) }
        children.add(link)
    }

    fun script(src: String? = null, block: (Script.() -> Unit)? = null) {
        val script = Script()
        src?.let { script.attr("src", it) }
        block?.let { script.it() }
        children.add(script)
    }

    fun style(block: Style.() -> Unit) {
        val style = Style()
        style.block()
        children.add(style)
    }
}

/**
 * Body element
 */
class Body : HtmlElement("body") {
    fun div(classes: String? = null, block: Div.() -> Unit) {
        val div = Div()
        classes?.let { div.attr("class", it) }
        div.block()
        children.add(div)
    }

    fun p(classes: String? = null, block: P.() -> Unit) {
        val p = P()
        classes?.let { p.attr("class", it) }
        p.block()
        children.add(p)
    }

    fun h1(classes: String? = null, block: H1.() -> Unit) {
        val h1 = H1()
        classes?.let { h1.attr("class", it) }
        h1.block()
        children.add(h1)
    }

    fun h2(classes: String? = null, block: H2.() -> Unit) {
        val h2 = H2()
        classes?.let { h2.attr("class", it) }
        h2.block()
        children.add(h2)
    }

    fun ul(classes: String? = null, block: Ul.() -> Unit) {
        val ul = Ul()
        classes?.let { ul.attr("class", it) }
        ul.block()
        children.add(ul)
    }

    fun form(action: String, method: String = "POST", block: Form.() -> Unit) {
        val form = Form()
        form.attr("action", action)
        form.attr("method", method)
        form.block()
        children.add(form)
    }

    fun section(classes: String? = null, block: Section.() -> Unit) {
        val section = Section()
        classes?.let { section.attr("class", it) }
        section.block()
        children.add(section)
    }

    fun a(href: String, classes: String? = null, block: A.() -> Unit) {
        val a = A()
        a.attr("href", href)
        classes?.let { a.attr("class", it) }
        a.block()
        children.add(a)
    }
}

// Element classes
class Title : HtmlElement("title")
class Meta : HtmlElement("meta")
class Link : HtmlElement("link")
class Script : HtmlElement("script")
class Style : HtmlElement("style")
class Div : HtmlElement("div") {
    fun span(classes: String? = null, block: Span.() -> Unit) {
        val span = Span()
        classes?.let { span.attr("class", it) }
        span.block()
        children.add(span)
    }

    fun p(classes: String? = null, block: P.() -> Unit) {
        val p = P()
        classes?.let { p.attr("class", it) }
        p.block()
        children.add(p)
    }

    fun img(src: String, alt: String, classes: String? = null) {
        val img = Img()
        img.attr("src", src)
        img.attr("alt", alt)
        classes?.let { img.attr("class", it) }
        children.add(img)
    }
}
class P : HtmlElement("p")
class Span : HtmlElement("span")
class A : HtmlElement("a")
class Img : HtmlElement("img")
class H1 : HtmlElement("h1")
class H2 : HtmlElement("h2")
class H3 : HtmlElement("h3")
class H4 : HtmlElement("h4")
class H5 : HtmlElement("h5")
class H6 : HtmlElement("h6")
class Section : HtmlElement("section")

class Ul : HtmlElement("ul") {
    fun li(block: Li.() -> Unit) {
        val li = Li()
        li.block()
        children.add(li)
    }
}
class Li : HtmlElement("li")

class Form : HtmlElement("form") {
    fun input(type: String, name: String, placeholder: String? = null) {
        val input = Input()
        input.attr("type", type)
        input.attr("name", name)
        placeholder?.let { input.attr("placeholder", it) }
        children.add(input)
    }

    fun button(type: String = "submit", block: Button.() -> Unit) {
        val button = Button()
        button.attr("type", type)
        button.block()
        children.add(button)
    }
}
class Input : HtmlElement("input")
class Button : HtmlElement("button")

/**
 * HTML DSL builder function
 */
fun html(block: Html.() -> Unit): String {
    val html = Html()
    html.attr("lang", "en")
    html.block()
    return "<!DOCTYPE html>\n${html.render()}"
}

/**
 * Example usage:
 *
 * val page = html {
 *     head {
 *         title("My App")
 *         meta("viewport", "width=device-width, initial-scale=1")
 *         link("stylesheet", "/styles.css")
 *     }
 *     body {
 *         div(classes = "container") {
 *             h1 { text("Welcome") }
 *             p { text("This is a paragraph") }
 *             ul {
 *                 li { text("Item 1") }
 *                 li { text("Item 2") }
 *             }
 *         }
 *     }
 * }
 */
