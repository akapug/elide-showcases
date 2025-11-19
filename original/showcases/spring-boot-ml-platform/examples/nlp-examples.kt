package com.example.mlplatform.examples.nlp

import elide.runtime.gvm.annotations.Polyglot

/**
 * NLP Examples - Text Processing and Analysis
 *
 * Comprehensive NLP examples using Python libraries in Kotlin
 * via Elide's polyglot runtime.
 *
 * Topics covered:
 * - Sentiment Analysis
 * - Text Classification
 * - Named Entity Recognition
 * - Topic Modeling
 * - Text Summarization
 * - Language Translation
 * - Question Answering
 * - Text Generation
 */

// ============================================================================
// Example 1: Advanced Sentiment Analysis with BERT
// ============================================================================

@Polyglot
fun sentimentAnalysisWithBERT() {
    println("=== Sentiment Analysis with BERT ===\n")

    val transformers = importPython("transformers")
    val torch = importPython("torch")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Load pre-trained sentiment analysis model
    println("Loading BERT model for sentiment analysis...")

    val modelName = "distilbert-base-uncased-finetuned-sst-2-english"
    val tokenizer = transformers.AutoTokenizer.from_pretrained(modelName)
    val model = transformers.AutoModelForSequenceClassification.from_pretrained(modelName)

    println("Model loaded successfully\n")

    // Sample reviews
    val reviews = listOf(
        "This product exceeded my expectations! Absolutely love it!",
        "Worst purchase ever. Complete waste of money.",
        "It's okay, nothing special but does the job.",
        "Amazing quality and fast shipping. Highly recommended!",
        "Terrible customer service and the product broke after one use.",
        "Good value for the price. Would buy again.",
        "Don't waste your time with this. Very disappointed.",
        "Fantastic! Best purchase I've made this year.",
        "Average product, met my basic needs.",
        "Outstanding! Can't believe how good this is!"
    )

    println("Analyzing ${reviews.size} customer reviews...\n")

    val results = reviews.map { review ->
        // Tokenize
        val inputs = tokenizer(
            review,
            return_tensors = "pt",
            padding = true,
            truncation = true,
            max_length = 512
        )

        // Get predictions
        val outputs = model(**inputs)
        val predictions = torch.nn.functional.softmax(outputs.logits, dim = 1)
        val scores = predictions[0].tolist()

        val sentiment = if (scores[1] > scores[0]) "POSITIVE" else "NEGATIVE"
        val confidence = scores.max()

        mapOf(
            "review" to review,
            "sentiment" to sentiment,
            "confidence" to confidence,
            "positive_score" to scores[1],
            "negative_score" to scores[0]
        )
    }

    // Display results
    println("Analysis Results:")
    println("-" * 80)

    results.forEach { result ->
        val sentiment = result["sentiment"]
        val confidence = String.format("%.2f", (result["confidence"] as Double) * 100)

        println("\nReview: ${result["review"]}")
        println("Sentiment: $sentiment ($confidence% confident)")
        println("Positive: ${String.format("%.2f", (result["positive_score"] as Double) * 100)}%")
        println("Negative: ${String.format("%.2f", (result["negative_score"] as Double) * 100)}%")
    }

    // Statistics
    val positiveCount = results.count { it["sentiment"] == "POSITIVE" }
    val negativeCount = results.count { it["sentiment"] == "NEGATIVE" }
    val avgConfidence = results.map { it["confidence"] as Double }.average()

    println("\n" + "-" * 80)
    println("Summary:")
    println("  Total reviews: ${reviews.size}")
    println("  Positive: $positiveCount (${positiveCount * 100 / reviews.size}%)")
    println("  Negative: $negativeCount (${negativeCount * 100 / reviews.size}%)")
    println("  Average confidence: ${String.format("%.2f", avgConfidence * 100)}%")
}

// ============================================================================
// Example 2: Multi-Class Text Classification
// ============================================================================

@Polyglot
fun textClassification() {
    println("\n=== Multi-Class Text Classification ===\n")

    val sklearn = importPython("sklearn")
    val pandas = importPython("pandas")
    val numpy = importPython("numpy")

    // Sample news articles
    println("Generating sample news articles...")

    val articles = listOf(
        "Stock market reaches all-time high as tech stocks surge" to "business",
        "Scientists discover new exoplanet in habitable zone" to "science",
        "Championship team wins finals in dramatic overtime" to "sports",
        "New AI model achieves breakthrough in language understanding" to "technology",
        "Central bank raises interest rates to combat inflation" to "business",
        "Researchers develop vaccine for emerging disease" to "science",
        "Olympic athlete breaks world record" to "sports",
        "Latest smartphone features revolutionary camera system" to "technology",
        "GDP growth exceeds expectations in Q4" to "business",
        "Climate change study shows accelerating trends" to "science"
    )

    val texts = articles.map { it.first }
    val labels = articles.map { it.second }

    println("  Total articles: ${articles.size}")
    println("  Categories: ${labels.distinct().size}\n")

    // Feature extraction with TF-IDF
    println("Extracting features with TF-IDF...")

    val vectorizer = sklearn.feature_extraction.text.TfidfVectorizer(
        max_features = 100,
        ngram_range = Pair(1, 2),
        stop_words = "english"
    )

    val X = vectorizer.fit_transform(texts)

    println("  Feature dimensions: ${X.shape}\n")

    // Train classifier
    println("Training Naive Bayes classifier...")

    val model = sklearn.naive_bayes.MultinomialNB()
    model.fit(X, labels)

    // Test predictions
    val testTexts = listOf(
        "Bitcoin price surges to new record",
        "Mars rover discovers ancient river bed",
        "Tennis champion wins third grand slam title",
        "Artificial intelligence revolutionizes healthcare"
    )

    println("\nPredictions on new articles:")
    println("-" * 80)

    testTexts.forEach { text ->
        val features = vectorizer.transform(listOf(text))
        val prediction = model.predict(features)[0]
        val probabilities = model.predict_proba(features)[0]

        println("\nText: $text")
        println("Predicted category: $prediction")
        println("Probabilities:")

        model.classes_.zip(probabilities.tolist()).forEach { (category, prob) ->
            println("  $category: ${String.format("%.2f", (prob as Double) * 100)}%")
        }
    }
}

// ============================================================================
// Example 3: Named Entity Recognition (NER)
// ============================================================================

@Polyglot
fun namedEntityRecognition() {
    println("\n=== Named Entity Recognition ===\n")

    val transformers = importPython("transformers")

    println("Loading NER model...")

    val tokenizer = transformers.AutoTokenizer.from_pretrained("dslim/bert-base-NER")
    val model = transformers.AutoModelForTokenClassification.from_pretrained("dslim/bert-base-NER")
    val nerPipeline = transformers.pipeline(
        "ner",
        model = model,
        tokenizer = tokenizer,
        aggregation_strategy = "simple"
    )

    // Sample texts
    val texts = listOf(
        "Apple Inc. CEO Tim Cook announced the new iPhone at the event in San Francisco.",
        "Amazon.com founder Jeff Bezos invested in Blue Origin, a space company based in Seattle.",
        "Microsoft acquired LinkedIn for $26.2 billion in June 2016.",
        "Elon Musk's Tesla is building a new factory in Austin, Texas."
    )

    println("Processing ${texts.size} texts...\n")

    texts.forEach { text ->
        println("Text: $text")
        println("Entities:")

        val entities = nerPipeline(text)

        entities.forEach { entity ->
            val word = entity["word"]
            val entityType = entity["entity_group"]
            val score = String.format("%.2f", (entity["score"] as Double) * 100)

            println("  - $word ($entityType) - $score% confident")
        }

        println()
    }
}

// ============================================================================
// Example 4: Topic Modeling with LDA
// ============================================================================

@Polyglot
fun topicModeling() {
    println("\n=== Topic Modeling with LDA ===\n")

    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    // Sample documents
    val documents = listOf(
        "Machine learning algorithms can identify patterns in large datasets",
        "Deep learning neural networks require significant computational resources",
        "Natural language processing helps computers understand human language",
        "Computer vision enables machines to interpret visual information",
        "Stock market analysis relies on historical price data and trends",
        "Portfolio diversification reduces investment risk across asset classes",
        "Cryptocurrency trading platforms offer 24/7 market access",
        "Economic indicators help predict market movements and trends",
        "Climate change affects global weather patterns and ecosystems",
        "Renewable energy sources reduce carbon emissions significantly",
        "Biodiversity conservation protects endangered species habitats",
        "Sustainable agriculture practices improve soil health long-term"
    )

    println("Analyzing ${documents.size} documents for topics...\n")

    // Create document-term matrix
    val vectorizer = sklearn.feature_extraction.text.CountVectorizer(
        max_features = 100,
        stop_words = "english",
        min_df = 1
    )

    val dtm = vectorizer.fit_transform(documents)
    val featureNames = vectorizer.get_feature_names_out()

    // Train LDA model
    val nTopics = 3
    println("Training LDA with $nTopics topics...")

    val lda = sklearn.decomposition.LatentDirichletAllocation(
        n_components = nTopics,
        random_state = 42,
        max_iter = 20
    )

    lda.fit(dtm)

    // Display topics
    println("\nDiscovered Topics:")
    println("-" * 80)

    val nTopWords = 5

    (0 until nTopics).forEach { topicIdx ->
        println("\nTopic #${topicIdx + 1}:")

        val topicWeights = lda.components_[topicIdx]
        val topIndices = topicWeights.argsort()["-$nTopWords:"]

        val topWords = topIndices.reversed().map { idx ->
            featureNames[idx as Int]
        }

        println("  Keywords: ${topWords.joinToString(", ")}")
    }

    // Document-topic distribution
    val docTopics = lda.transform(dtm)

    println("\n\nDocument-Topic Distribution:")
    println("-" * 80)

    documents.take(5).forEachIndexed { idx, doc ->
        println("\nDocument: ${doc.take(60)}...")

        val topicDist = docTopics[idx]
        topicDist.forEachIndexed { topicIdx, prob ->
            println("  Topic ${topicIdx + 1}: ${String.format("%.2f", (prob as Double) * 100)}%")
        }
    }
}

// ============================================================================
// Example 5: Text Summarization
// ============================================================================

@Polyglot
fun textSummarization() {
    println("\n=== Text Summarization ===\n")

    val transformers = importPython("transformers")

    println("Loading summarization model...")

    val summarizer = transformers.pipeline("summarization", model = "facebook/bart-large-cnn")

    // Long article
    val article = """
        Artificial intelligence has made remarkable progress in recent years, transforming
        industries and changing how we interact with technology. Machine learning algorithms
        can now perform tasks that were once thought to be exclusively human, from recognizing
        faces in photos to translating languages in real-time.

        Deep learning, a subset of machine learning, has been particularly successful. Neural
        networks with multiple layers can learn complex patterns from vast amounts of data.
        This has led to breakthroughs in computer vision, natural language processing, and
        speech recognition.

        However, challenges remain. AI systems can be biased, reflecting the biases present
        in their training data. They also require significant computational resources and
        energy. Researchers are working on making AI more efficient, fair, and transparent.

        The future of AI looks promising. Advances in areas like reinforcement learning and
        transfer learning are expanding what's possible. As AI continues to evolve, it will
        likely play an increasingly important role in solving complex global challenges.
    """.trimIndent()

    println("Original article (${article.length} characters):")
    println("-" * 80)
    println(article)

    println("\n" + "-" * 80)
    println("Generating summary...\n")

    val summary = summarizer(
        article,
        max_length = 100,
        min_length = 30,
        do_sample = false
    )[0]["summary_text"]

    println("Summary (${summary.toString().length} characters):")
    println("-" * 80)
    println(summary)

    val compressionRatio = (article.length - summary.toString().length).toDouble() / article.length * 100
    println("\nCompression ratio: ${String.format("%.1f", compressionRatio)}%")
}

// ============================================================================
// Example 6: Question Answering
// ============================================================================

@Polyglot
fun questionAnswering() {
    println("\n=== Question Answering System ===\n")

    val transformers = importPython("transformers")

    println("Loading QA model...")

    val qa = transformers.pipeline("question-answering", model = "distilbert-base-cased-distilled-squad")

    // Context
    val context = """
        The Elide framework enables polyglot programming by allowing developers to seamlessly
        mix multiple programming languages within a single application. With Elide, you can
        import Python libraries directly in Kotlin code, eliminating the need for microservices
        and HTTP APIs. This approach reduces latency from 50-200ms to under 10ms, while also
        decreasing memory usage by up to 66%. The framework is built on GraalVM and supports
        multiple languages including Python, JavaScript, Ruby, and R.
    """

    println("Context:")
    println("-" * 80)
    println(context)
    println()

    // Questions
    val questions = listOf(
        "What is Elide?",
        "What latency improvements does Elide provide?",
        "How much memory does Elide save?",
        "What is Elide built on?",
        "Which languages does Elide support?"
    )

    println("Answering questions:")
    println("-" * 80)

    questions.forEach { question ->
        val result = qa(question = question, context = context)

        val answer = result["answer"]
        val score = String.format("%.2f", (result["score"] as Double) * 100)

        println("\nQ: $question")
        println("A: $answer (confidence: $score%)")
    }
}

// ============================================================================
// Example 7: Text Embeddings and Similarity
// ============================================================================

@Polyglot
fun textEmbeddings() {
    println("\n=== Text Embeddings and Similarity ===\n")

    val transformers = importPython("transformers")
    val torch = importPython("torch")
    val sklearn = importPython("sklearn")
    val numpy = importPython("numpy")

    println("Loading sentence transformer model...")

    val tokenizer = transformers.AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
    val model = transformers.AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

    // Sample sentences
    val sentences = listOf(
        "Machine learning is a subset of artificial intelligence",
        "AI helps computers learn from data automatically",
        "The weather is nice today with clear skies",
        "Deep learning uses neural networks with many layers",
        "It's sunny and warm outside this afternoon"
    )

    println("Computing embeddings for ${sentences.size} sentences...\n")

    // Compute embeddings
    val embeddings = sentences.map { sentence ->
        val inputs = tokenizer(
            sentence,
            return_tensors = "pt",
            padding = true,
            truncation = true
        )

        val outputs = model(**inputs)

        // Mean pooling
        val embedding = outputs.last_hidden_state.mean(dim = 1)[0]
        embedding.detach().numpy()
    }

    // Compute cosine similarity matrix
    val similarities = numpy.zeros(Pair(sentences.size, sentences.size))

    for (i in 0 until sentences.size) {
        for (j in 0 until sentences.size) {
            val sim = sklearn.metrics.pairwise.cosine_similarity(
                embeddings[i].reshape(1, -1),
                embeddings[j].reshape(1, -1)
            )[0][0]

            similarities[i][j] = sim
        }
    }

    // Display similarity matrix
    println("Similarity Matrix:")
    println("-" * 80)

    sentences.forEachIndexed { i, sentence1 ->
        println("\n\"${sentence1}\"")

        sentences.forEachIndexed { j, sentence2 ->
            if (i != j) {
                val sim = String.format("%.2f", (similarities[i][j] as Double) * 100)
                println("  vs \"$sentence2\": $sim%")
            }
        }
    }

    // Find most similar pairs
    println("\n" + "-" * 80)
    println("Most Similar Sentence Pairs:")

    val pairs = mutableListOf<Triple<Int, Int, Double>>()

    for (i in 0 until sentences.size) {
        for (j in (i + 1) until sentences.size) {
            pairs.add(Triple(i, j, similarities[i][j] as Double))
        }
    }

    pairs.sortedByDescending { it.third }.take(3).forEach { (i, j, sim) ->
        println("\n${String.format("%.2f", sim * 100)}% similar:")
        println("  1. ${sentences[i]}")
        println("  2. ${sentences[j]}")
    }
}

// ============================================================================
// Example 8: Language Detection
// ============================================================================

@Polyglot
fun languageDetection() {
    println("\n=== Language Detection ===\n")

    val langdetect = importPython("langdetect")

    // Multilingual samples
    val texts = mapOf(
        "Hello, how are you doing today?" to "English",
        "Bonjour, comment allez-vous?" to "French",
        "Hola, ¿cómo estás?" to "Spanish",
        "Guten Tag, wie geht es Ihnen?" to "German",
        "Ciao, come stai?" to "Italian",
        "こんにちは、元気ですか?" to "Japanese",
        "你好，你好吗?" to "Chinese",
        "Привет, как дела?" to "Russian"
    )

    println("Detecting languages for ${texts.size} samples...\n")

    texts.forEach { (text, expected) ->
        val detected = langdetect.detect(text)

        println("Text: $text")
        println("Expected: $expected")
        println("Detected: $detected")
        println()
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

@Polyglot
private fun importPython(module: String): dynamic {
    return js("require('python:$module')")
}

private operator fun String.times(count: Int): String = this.repeat(count)

// ============================================================================
// Main Demo
// ============================================================================

fun main() {
    println("╔══════════════════════════════════════════════════════════╗")
    println("║              NLP Examples with Elide Polyglot             ║")
    println("║              Python + Kotlin in Spring Boot              ║")
    println("╚══════════════════════════════════════════════════════════╝")
    println()

    try {
        sentimentAnalysisWithBERT()
        textClassification()
        namedEntityRecognition()
        topicModeling()
        textSummarization()
        questionAnswering()
        textEmbeddings()
        languageDetection()

        println("\n" + "=".repeat(60))
        println("All NLP examples completed successfully!")
        println("=".repeat(60))

    } catch (e: Exception) {
        println("\nError: ${e.message}")
        e.printStackTrace()
    }
}
