/**
 * Polyglot Data Science Notebook
 *
 * This is the main notebook demonstrating Elide's revolutionary polyglot syntax.
 * We import Python libraries directly into TypeScript and use them natively!
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - The Polyglot Magic!
// ============================================================================

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import seaborn from 'python:seaborn';
// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import sklearn from 'python:sklearn';

/**
 * Section 1: NumPy Arrays in TypeScript
 *
 * NumPy is the foundation of scientific computing in Python.
 * Now we can use it directly in TypeScript!
 */
class NumpyExamples {
  /**
   * Basic array creation and operations
   */
  static basicOperations(): void {
    console.log('=== NumPy Basic Operations ===\n');

    // Create arrays using different methods
    const arr1 = numpy.array([1, 2, 3, 4, 5]);
    const arr2 = numpy.arange(0, 10, 2); // [0, 2, 4, 6, 8]
    const arr3 = numpy.linspace(0, 1, 5); // [0.0, 0.25, 0.5, 0.75, 1.0]
    const arr4 = numpy.zeros([3, 4]); // 3x4 matrix of zeros
    const arr5 = numpy.ones([2, 3]); // 2x3 matrix of ones
    const arr6 = numpy.eye(4); // 4x4 identity matrix

    console.log('Array 1:', arr1.tolist());
    console.log('Array 2 (arange):', arr2.tolist());
    console.log('Array 3 (linspace):', arr3.tolist());
    console.log('Zeros matrix:', arr4.tolist());
    console.log('Ones matrix:', arr5.tolist());
    console.log('Identity matrix:', arr6.tolist());

    // Array properties
    console.log('\nArray Properties:');
    console.log('Shape:', arr1.shape);
    console.log('Size:', arr1.size);
    console.log('Dimensions:', arr1.ndim);
    console.log('Data type:', arr1.dtype);

    // Basic statistics
    console.log('\nStatistics:');
    console.log('Mean:', numpy.mean(arr1));
    console.log('Median:', numpy.median(arr1));
    console.log('Standard deviation:', numpy.std(arr1));
    console.log('Variance:', numpy.var(arr1));
    console.log('Min:', numpy.min(arr1));
    console.log('Max:', numpy.max(arr1));
    console.log('Sum:', numpy.sum(arr1));
  }

  /**
   * Array indexing and slicing
   */
  static indexingSlicing(): void {
    console.log('\n=== NumPy Indexing and Slicing ===\n');

    const arr = numpy.arange(20);
    console.log('Original array:', arr.tolist());

    // Basic indexing
    console.log('Element at index 5:', arr[5]);
    console.log('Elements from index 5 to 10:', arr.slice(5, 10).tolist());
    console.log('Every 2nd element:', arr.slice(null, null, 2).tolist());
    console.log('Reversed array:', arr.slice(null, null, -1).tolist());

    // Multi-dimensional indexing
    const matrix = numpy.arange(12).reshape([3, 4]);
    console.log('\nMatrix:', matrix.tolist());
    console.log('Element at [1, 2]:', matrix[1][2]);
    console.log('First row:', matrix[0].tolist());
    console.log('Last column:', matrix.slice(null, -1).tolist());

    // Boolean indexing
    const data = numpy.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const mask = data > 5;
    const filtered = data[mask];
    console.log('\nBoolean indexing (> 5):', filtered.tolist());

    // Fancy indexing
    const indices = numpy.array([0, 2, 4, 6]);
    const selected = data[indices];
    console.log('Fancy indexing [0,2,4,6]:', selected.tolist());
  }

  /**
   * Array reshaping and manipulation
   */
  static reshapingManipulation(): void {
    console.log('\n=== NumPy Reshaping and Manipulation ===\n');

    const arr = numpy.arange(12);
    console.log('Original array:', arr.tolist());

    // Reshaping
    const reshaped1 = arr.reshape([3, 4]);
    const reshaped2 = arr.reshape([2, 6]);
    const reshaped3 = arr.reshape([4, 3]);

    console.log('Reshaped to 3x4:', reshaped1.tolist());
    console.log('Reshaped to 2x6:', reshaped2.tolist());
    console.log('Reshaped to 4x3:', reshaped3.tolist());

    // Flattening
    const flattened = reshaped1.flatten();
    console.log('Flattened:', flattened.tolist());

    // Transposing
    const matrix = numpy.array([[1, 2, 3], [4, 5, 6]]);
    const transposed = numpy.transpose(matrix);
    console.log('\nOriginal matrix:', matrix.tolist());
    console.log('Transposed:', transposed.tolist());

    // Stacking arrays
    const a = numpy.array([1, 2, 3]);
    const b = numpy.array([4, 5, 6]);
    const vstack = numpy.vstack([a, b]);
    const hstack = numpy.hstack([a, b]);

    console.log('\nVertical stack:', vstack.tolist());
    console.log('Horizontal stack:', hstack.tolist());

    // Splitting arrays
    const arr_to_split = numpy.arange(12);
    const split = numpy.array_split(arr_to_split, 3);
    console.log('\nSplit into 3 parts:', split.map((s: any) => s.tolist()));
  }

  /**
   * Mathematical operations
   */
  static mathematicalOperations(): void {
    console.log('\n=== NumPy Mathematical Operations ===\n');

    const a = numpy.array([1, 2, 3, 4, 5]);
    const b = numpy.array([10, 20, 30, 40, 50]);

    // Element-wise operations
    console.log('Addition:', (a + b).tolist());
    console.log('Subtraction:', (a - b).tolist());
    console.log('Multiplication:', (a * b).tolist());
    console.log('Division:', (a / b).tolist());
    console.log('Power:', numpy.power(a, 2).tolist());

    // Universal functions
    const x = numpy.linspace(0, 2 * Math.PI, 10);
    console.log('\nUniversal functions:');
    console.log('Sin:', numpy.sin(x).tolist());
    console.log('Cos:', numpy.cos(x).tolist());
    console.log('Tan:', numpy.tan(x).tolist());
    console.log('Exp:', numpy.exp(a).tolist());
    console.log('Log:', numpy.log(a).tolist());
    console.log('Sqrt:', numpy.sqrt(a).tolist());

    // Aggregation functions
    const matrix = numpy.random.rand(5, 5);
    console.log('\nAggregation:');
    console.log('Sum:', numpy.sum(matrix));
    console.log('Mean:', numpy.mean(matrix));
    console.log('Std:', numpy.std(matrix));
    console.log('Sum along axis 0:', numpy.sum(matrix, { axis: 0 }).tolist());
    console.log('Mean along axis 1:', numpy.mean(matrix, { axis: 1 }).tolist());
  }

  /**
   * Linear algebra operations
   */
  static linearAlgebra(): void {
    console.log('\n=== NumPy Linear Algebra ===\n');

    // Matrix creation
    const A = numpy.array([[1, 2], [3, 4]]);
    const B = numpy.array([[5, 6], [7, 8]]);

    console.log('Matrix A:', A.tolist());
    console.log('Matrix B:', B.tolist());

    // Matrix operations
    const product = numpy.dot(A, B);
    const determinant = numpy.linalg.det(A);
    const inverse = numpy.linalg.inv(A);
    const eigenvalues = numpy.linalg.eigvals(A);

    console.log('\nMatrix product A·B:', product.tolist());
    console.log('Determinant of A:', determinant);
    console.log('Inverse of A:', inverse.tolist());
    console.log('Eigenvalues of A:', eigenvalues.tolist());

    // Solving linear equations: Ax = b
    const A_eq = numpy.array([[3, 1], [1, 2]]);
    const b = numpy.array([9, 8]);
    const x = numpy.linalg.solve(A_eq, b);

    console.log('\nSolving Ax = b:');
    console.log('A:', A_eq.tolist());
    console.log('b:', b.tolist());
    console.log('x:', x.tolist());
    console.log('Verification A·x:', numpy.dot(A_eq, x).tolist());

    // Matrix decompositions
    const large_matrix = numpy.random.rand(5, 5);
    const [Q, R] = numpy.linalg.qr(large_matrix);
    const [U, s, V] = numpy.linalg.svd(large_matrix);

    console.log('\nQR Decomposition:');
    console.log('Q shape:', Q.shape);
    console.log('R shape:', R.shape);

    console.log('\nSVD:');
    console.log('U shape:', U.shape);
    console.log('Singular values:', s.tolist());
    console.log('V shape:', V.shape);
  }

  /**
   * Random number generation
   */
  static randomNumbers(): void {
    console.log('\n=== NumPy Random Numbers ===\n');

    // Set seed for reproducibility
    numpy.random.seed(42);

    // Different distributions
    const uniform = numpy.random.rand(5);
    const normal = numpy.random.randn(5);
    const integers = numpy.random.randint(0, 100, 10);
    const choice = numpy.random.choice([1, 2, 3, 4, 5], 10);

    console.log('Uniform [0, 1]:', uniform.tolist());
    console.log('Normal (mean=0, std=1):', normal.tolist());
    console.log('Random integers [0, 100):', integers.tolist());
    console.log('Random choice:', choice.tolist());

    // Custom distributions
    const custom_normal = numpy.random.normal(100, 15, 10);
    const exponential = numpy.random.exponential(2, 10);
    const binomial = numpy.random.binomial(10, 0.5, 10);

    console.log('\nCustom Normal (mean=100, std=15):', custom_normal.tolist());
    console.log('Exponential (scale=2):', exponential.tolist());
    console.log('Binomial (n=10, p=0.5):', binomial.tolist());

    // Shuffling and permutations
    const arr = numpy.arange(10);
    const shuffled = numpy.random.permutation(arr);
    console.log('\nOriginal:', arr.tolist());
    console.log('Shuffled:', shuffled.tolist());
  }
}

/**
 * Section 2: Pandas DataFrames in TypeScript
 *
 * Pandas is the go-to library for data manipulation in Python.
 * Now we can use it in TypeScript with full type safety!
 */
class PandasExamples {
  /**
   * Creating DataFrames
   */
  static createDataFrames(): void {
    console.log('\n=== Pandas DataFrame Creation ===\n');

    // From dictionary
    const df1 = pandas.DataFrame({
      name: ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
      age: [25, 30, 35, 40, 45],
      city: ['New York', 'London', 'Paris', 'Tokyo', 'Sydney'],
      salary: [50000, 60000, 70000, 80000, 90000]
    });

    console.log('DataFrame from dict:');
    console.log(df1.toString());

    // From NumPy array
    const arr = numpy.random.rand(5, 3);
    const df2 = pandas.DataFrame(arr, {
      columns: ['A', 'B', 'C'],
      index: ['row1', 'row2', 'row3', 'row4', 'row5']
    });

    console.log('\nDataFrame from NumPy array:');
    console.log(df2.toString());

    // From list of dictionaries
    const data = [
      { product: 'A', sales: 100, profit: 20 },
      { product: 'B', sales: 150, profit: 30 },
      { product: 'C', sales: 200, profit: 50 }
    ];
    const df3 = pandas.DataFrame(data);

    console.log('\nDataFrame from list of dicts:');
    console.log(df3.toString());
  }

  /**
   * DataFrame inspection
   */
  static inspectDataFrame(): void {
    console.log('\n=== Pandas DataFrame Inspection ===\n');

    const df = pandas.DataFrame({
      A: numpy.random.randn(100),
      B: numpy.random.randn(100),
      C: numpy.random.randint(0, 10, 100),
      D: numpy.random.choice(['cat', 'dog', 'bird', 'fish'], 100)
    });

    console.log('First 5 rows:');
    console.log(df.head().toString());

    console.log('\nLast 5 rows:');
    console.log(df.tail().toString());

    console.log('\nDataFrame info:');
    console.log(df.info());

    console.log('\nStatistical summary:');
    console.log(df.describe().toString());

    console.log('\nShape:', df.shape);
    console.log('Columns:', df.columns.tolist());
    console.log('Index:', df.index.tolist().slice(0, 10), '...');
    console.log('Data types:', df.dtypes.toString());
  }

  /**
   * Selecting and filtering data
   */
  static selectFilter(): void {
    console.log('\n=== Pandas Selection and Filtering ===\n');

    const df = pandas.DataFrame({
      name: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'],
      age: [25, 30, 35, 40, 45, 50],
      city: ['NY', 'LA', 'Chicago', 'Houston', 'Phoenix', 'Philly'],
      salary: [50000, 60000, 70000, 80000, 90000, 100000],
      department: ['Sales', 'IT', 'Sales', 'IT', 'HR', 'Sales']
    });

    console.log('Original DataFrame:');
    console.log(df.toString());

    // Select columns
    console.log('\nSelect "name" column:');
    console.log(df['name'].toString());

    console.log('\nSelect multiple columns:');
    console.log(df[['name', 'salary']].toString());

    // Filter rows
    console.log('\nFilter age > 35:');
    console.log(df[df['age'] > 35].toString());

    console.log('\nFilter salary >= 70000:');
    console.log(df[df['salary'] >= 70000].toString());

    console.log('\nFilter department == "Sales":');
    console.log(df[df['department'] == 'Sales'].toString());

    // Multiple conditions
    console.log('\nFilter age > 30 AND salary > 70000:');
    const mask = (df['age'] > 30) & (df['salary'] > 70000);
    console.log(df[mask].toString());

    // Using query method
    console.log('\nUsing query (age > 30):');
    console.log(df.query('age > 30').toString());
  }

  /**
   * Grouping and aggregation
   */
  static groupAggregate(): void {
    console.log('\n=== Pandas Grouping and Aggregation ===\n');

    const df = pandas.DataFrame({
      department: ['Sales', 'Sales', 'IT', 'IT', 'HR', 'HR', 'Sales', 'IT'],
      employee: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      salary: [50000, 60000, 70000, 80000, 55000, 65000, 58000, 75000],
      bonus: [5000, 6000, 7000, 8000, 5500, 6500, 5800, 7500]
    });

    console.log('Original DataFrame:');
    console.log(df.toString());

    // Group by single column
    console.log('\nGroup by department (mean):');
    const grouped = df.groupby('department').mean();
    console.log(grouped.toString());

    // Multiple aggregations
    console.log('\nMultiple aggregations:');
    const agg = df.groupby('department').agg({
      salary: ['mean', 'min', 'max', 'std'],
      bonus: ['sum', 'mean']
    });
    console.log(agg.toString());

    // Count by group
    console.log('\nCount by department:');
    console.log(df.groupby('department').size().toString());

    // Custom aggregation
    console.log('\nCustom aggregation (total compensation):');
    const total = df.groupby('department').apply(
      (group: any) => (group['salary'] + group['bonus']).sum()
    );
    console.log(total.toString());
  }

  /**
   * Data cleaning and transformation
   */
  static cleanTransform(): void {
    console.log('\n=== Pandas Data Cleaning and Transformation ===\n');

    // Create DataFrame with missing values
    const df = pandas.DataFrame({
      A: [1, 2, null, 4, 5],
      B: [10, null, 30, null, 50],
      C: ['a', 'b', 'c', 'd', 'e']
    });

    console.log('DataFrame with missing values:');
    console.log(df.toString());

    // Check for missing values
    console.log('\nMissing values:');
    console.log(df.isnull().sum().toString());

    // Drop missing values
    console.log('\nDrop rows with any missing values:');
    console.log(df.dropna().toString());

    // Fill missing values
    console.log('\nFill missing values with 0:');
    console.log(df.fillna(0).toString());

    // Forward fill
    console.log('\nForward fill:');
    console.log(df.fillna({ method: 'ffill' }).toString());

    // Replace values
    const df2 = pandas.DataFrame({
      status: ['active', 'inactive', 'active', 'pending', 'inactive']
    });

    console.log('\nReplace values:');
    console.log(df2.replace({ active: 1, inactive: 0, pending: -1 }).toString());

    // Apply functions
    const df3 = pandas.DataFrame({
      name: ['alice', 'bob', 'charlie'],
      age: [25, 30, 35]
    });

    console.log('\nApply uppercase to names:');
    df3['name_upper'] = df3['name'].apply((x: string) => x.toUpperCase());
    console.log(df3.toString());
  }

  /**
   * Merging and joining DataFrames
   */
  static mergeJoin(): void {
    console.log('\n=== Pandas Merge and Join ===\n');

    const df1 = pandas.DataFrame({
      employee_id: [1, 2, 3, 4],
      name: ['Alice', 'Bob', 'Charlie', 'David'],
      department_id: [10, 20, 10, 30]
    });

    const df2 = pandas.DataFrame({
      department_id: [10, 20, 30, 40],
      department_name: ['Sales', 'IT', 'HR', 'Finance']
    });

    console.log('Employee DataFrame:');
    console.log(df1.toString());

    console.log('\nDepartment DataFrame:');
    console.log(df2.toString());

    // Inner join
    console.log('\nInner join:');
    const inner = pandas.merge(df1, df2, { on: 'department_id', how: 'inner' });
    console.log(inner.toString());

    // Left join
    console.log('\nLeft join:');
    const left = pandas.merge(df1, df2, { on: 'department_id', how: 'left' });
    console.log(left.toString());

    // Right join
    console.log('\nRight join:');
    const right = pandas.merge(df1, df2, { on: 'department_id', how: 'right' });
    console.log(right.toString());

    // Concatenation
    const df3 = pandas.DataFrame({
      employee_id: [5, 6],
      name: ['Eve', 'Frank'],
      department_id: [20, 10]
    });

    console.log('\nConcatenate DataFrames:');
    const concatenated = pandas.concat([df1, df3], { ignore_index: true });
    console.log(concatenated.toString());
  }

  /**
   * Time series operations
   */
  static timeSeries(): void {
    console.log('\n=== Pandas Time Series ===\n');

    // Create date range
    const dates = pandas.date_range('2024-01-01', { periods: 10, freq: 'D' });
    const values = numpy.random.randn(10);

    const ts = pandas.Series(values, { index: dates });

    console.log('Time series:');
    console.log(ts.toString());

    // Resampling
    const dates2 = pandas.date_range('2024-01-01', { periods: 100, freq: 'H' });
    const values2 = numpy.random.randn(100);
    const ts2 = pandas.Series(values2, { index: dates2 });

    console.log('\nResample to daily (mean):');
    console.log(ts2.resample('D').mean().toString());

    // Rolling window
    console.log('\nRolling mean (window=7):');
    const dates3 = pandas.date_range('2024-01-01', { periods: 30, freq: 'D' });
    const values3 = numpy.random.randn(30).cumsum();
    const ts3 = pandas.Series(values3, { index: dates3 });

    console.log(ts3.rolling({ window: 7 }).mean().toString());

    // Shifting
    console.log('\nShift forward by 1:');
    console.log(ts3.shift(1).head().toString());

    console.log('\nShift backward by 1:');
    console.log(ts3.shift(-1).head().toString());
  }
}

/**
 * Section 3: Data Visualization with Matplotlib
 *
 * Create beautiful visualizations using matplotlib in TypeScript!
 */
class VisualizationExamples {
  /**
   * Basic plotting
   */
  static basicPlots(): void {
    console.log('\n=== Matplotlib Basic Plots ===\n');

    // Set style
    seaborn.set_style('whitegrid');

    // Line plot
    const x = numpy.linspace(0, 10, 100);
    const y1 = numpy.sin(x);
    const y2 = numpy.cos(x);

    matplotlib.figure({ figsize: [10, 6] });
    matplotlib.plot(x, y1, { label: 'sin(x)', color: 'blue', linewidth: 2 });
    matplotlib.plot(x, y2, { label: 'cos(x)', color: 'red', linewidth: 2 });
    matplotlib.title('Trigonometric Functions', { fontsize: 14, fontweight: 'bold' });
    matplotlib.xlabel('x', { fontsize: 12 });
    matplotlib.ylabel('y', { fontsize: 12 });
    matplotlib.legend({ loc: 'upper right' });
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.savefig('line_plot.png', { dpi: 300 });
    matplotlib.close();

    console.log('Line plot saved to line_plot.png');
  }

  /**
   * Statistical plots
   */
  static statisticalPlots(): void {
    console.log('\n=== Matplotlib Statistical Plots ===\n');

    matplotlib.figure({ figsize: [12, 8] });

    // Histogram
    matplotlib.subplot(2, 2, 1);
    const data1 = numpy.random.normal(0, 1, 1000);
    matplotlib.hist(data1, { bins: 30, alpha: 0.7, color: 'skyblue', edgecolor: 'black' });
    matplotlib.title('Histogram');
    matplotlib.xlabel('Value');
    matplotlib.ylabel('Frequency');

    // Scatter plot
    matplotlib.subplot(2, 2, 2);
    const x = numpy.random.randn(100);
    const y = 2 * x + numpy.random.randn(100);
    matplotlib.scatter(x, y, { alpha: 0.6, c: 'green', s: 50 });
    matplotlib.title('Scatter Plot');
    matplotlib.xlabel('X');
    matplotlib.ylabel('Y');

    // Box plot
    matplotlib.subplot(2, 2, 3);
    const data2 = [
      numpy.random.normal(0, 1, 100),
      numpy.random.normal(1, 1.5, 100),
      numpy.random.normal(2, 0.5, 100)
    ];
    matplotlib.boxplot(data2, { labels: ['A', 'B', 'C'] });
    matplotlib.title('Box Plot');
    matplotlib.ylabel('Value');

    // Bar plot
    matplotlib.subplot(2, 2, 4);
    const categories = ['A', 'B', 'C', 'D', 'E'];
    const values = [23, 45, 56, 78, 32];
    matplotlib.bar(categories, values, { color: 'coral', alpha: 0.7 });
    matplotlib.title('Bar Plot');
    matplotlib.xlabel('Category');
    matplotlib.ylabel('Value');

    matplotlib.tight_layout();
    matplotlib.savefig('statistical_plots.png', { dpi: 300 });
    matplotlib.close();

    console.log('Statistical plots saved to statistical_plots.png');
  }

  /**
   * Advanced visualizations
   */
  static advancedVisualizations(): void {
    console.log('\n=== Advanced Visualizations ===\n');

    // Heatmap
    const data = numpy.random.rand(10, 12);
    matplotlib.figure({ figsize: [10, 8] });
    seaborn.heatmap(data, {
      annot: true,
      fmt: '.2f',
      cmap: 'coolwarm',
      cbar_kws: { label: 'Value' }
    });
    matplotlib.title('Heatmap');
    matplotlib.savefig('heatmap.png', { dpi: 300 });
    matplotlib.close();

    console.log('Heatmap saved to heatmap.png');

    // 3D plot
    // Note: This would require matplotlib.pyplot as mpl_toolkits.mplot3d
    // For now, showing concept
    console.log('3D plotting available with python:mpl_toolkits.mplot3d');
  }
}

/**
 * Section 4: Machine Learning with Scikit-learn
 *
 * Build ML models directly in TypeScript using scikit-learn!
 */
class MachineLearningExamples {
  /**
   * Classification example
   */
  static classification(): void {
    console.log('\n=== Scikit-learn Classification ===\n');

    const { train_test_split } = sklearn.model_selection;
    const { StandardScaler } = sklearn.preprocessing;
    const { RandomForestClassifier } = sklearn.ensemble;
    const { accuracy_score, classification_report, confusion_matrix } = sklearn.metrics;

    // Generate synthetic data
    const { make_classification } = sklearn.datasets;
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      n_classes: 3,
      n_informative: 15,
      random_state: 42
    });

    // Split data
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Scale features
    const scaler = StandardScaler();
    const X_train_scaled = scaler.fit_transform(X_train);
    const X_test_scaled = scaler.transform(X_test);

    // Train model
    const model = RandomForestClassifier({ n_estimators: 100, random_state: 42 });
    model.fit(X_train_scaled, y_train);

    // Predictions
    const predictions = model.predict(X_test_scaled);
    const accuracy = accuracy_score(y_test, predictions);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, predictions));
    console.log('\nConfusion Matrix:');
    console.log(confusion_matrix(y_test, predictions));

    // Feature importance
    const importance = model.feature_importances_;
    console.log('\nTop 5 feature importances:');
    const indices = numpy.argsort(importance).slice(-5);
    for (const idx of indices.tolist().reverse()) {
      console.log(`Feature ${idx}: ${importance[idx].toFixed(4)}`);
    }
  }

  /**
   * Regression example
   */
  static regression(): void {
    console.log('\n=== Scikit-learn Regression ===\n');

    const { train_test_split } = sklearn.model_selection;
    const { LinearRegression } = sklearn.linear_model;
    const { mean_squared_error, r2_score } = sklearn.metrics;

    // Generate synthetic data
    const { make_regression } = sklearn.datasets;
    const [X, y] = make_regression({
      n_samples: 500,
      n_features: 10,
      noise: 10,
      random_state: 42
    });

    // Split data
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train model
    const model = LinearRegression();
    model.fit(X_train, y_train);

    // Predictions
    const predictions = model.predict(X_test);
    const mse = mean_squared_error(y_test, predictions);
    const rmse = Math.sqrt(mse);
    const r2 = r2_score(y_test, predictions);

    console.log(`RMSE: ${rmse.toFixed(2)}`);
    console.log(`R² Score: ${r2.toFixed(4)}`);
    console.log('\nModel coefficients:', model.coef_.tolist().slice(0, 5), '...');
    console.log(`Intercept: ${model.intercept_.toFixed(4)}`);
  }

  /**
   * Clustering example
   */
  static clustering(): void {
    console.log('\n=== Scikit-learn Clustering ===\n');

    const { KMeans } = sklearn.cluster;
    const { silhouette_score } = sklearn.metrics;

    // Generate synthetic data
    const { make_blobs } = sklearn.datasets;
    const [X, y_true] = make_blobs({
      n_samples: 300,
      centers: 4,
      n_features: 2,
      random_state: 42
    });

    // K-means clustering
    const kmeans = KMeans({ n_clusters: 4, random_state: 42 });
    const labels = kmeans.fit_predict(X);

    // Evaluate
    const silhouette = silhouette_score(X, labels);
    console.log(`Silhouette Score: ${silhouette.toFixed(4)}`);
    console.log('\nCluster centers:');
    console.log(kmeans.cluster_centers_);

    // Inertia
    console.log(`\nInertia: ${kmeans.inertia_.toFixed(2)}`);
  }
}

/**
 * Section 5: Statistical Analysis with SciPy
 *
 * Perform advanced statistical analysis using SciPy in TypeScript!
 */
class StatisticalAnalysis {
  /**
   * Statistical tests
   */
  static statisticalTests(): void {
    console.log('\n=== SciPy Statistical Tests ===\n');

    const { stats } = scipy;

    // T-test
    const sample1 = numpy.random.normal(0, 1, 100);
    const sample2 = numpy.random.normal(0.5, 1, 100);

    const [t_stat, p_value] = stats.ttest_ind(sample1, sample2);
    console.log('T-test:');
    console.log(`T-statistic: ${t_stat.toFixed(4)}`);
    console.log(`P-value: ${p_value.toFixed(4)}`);

    // Chi-square test
    const observed = numpy.array([10, 15, 20, 25]);
    const expected = numpy.array([12, 18, 18, 22]);
    const [chi2, p_chi] = stats.chisquare(observed, expected);
    console.log('\nChi-square test:');
    console.log(`Chi-square: ${chi2.toFixed(4)}`);
    console.log(`P-value: ${p_chi.toFixed(4)}`);

    // Correlation
    const x = numpy.random.randn(100);
    const y = 2 * x + numpy.random.randn(100);
    const [r, p_corr] = stats.pearsonr(x, y);
    console.log('\nPearson correlation:');
    console.log(`Correlation: ${r.toFixed(4)}`);
    console.log(`P-value: ${p_corr.toFixed(4)}`);
  }

  /**
   * Distributions
   */
  static distributions(): void {
    console.log('\n=== SciPy Distributions ===\n');

    const { stats } = scipy;

    // Normal distribution
    const mean = 100;
    const std = 15;
    const x = 115;
    const cdf = stats.norm.cdf(x, mean, std);
    const pdf = stats.norm.pdf(x, mean, std);

    console.log(`Normal distribution (μ=${mean}, σ=${std}):`);
    console.log(`CDF(${x}): ${cdf.toFixed(4)}`);
    console.log(`PDF(${x}): ${pdf.toFixed(4)}`);

    // Generate random samples
    const samples = stats.norm.rvs(mean, std, { size: 1000 });
    console.log(`\nGenerated ${samples.length} samples`);
    console.log(`Sample mean: ${numpy.mean(samples).toFixed(2)}`);
    console.log(`Sample std: ${numpy.std(samples).toFixed(2)}`);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('POLYGLOT DATA SCIENCE NOTEBOOK');
  console.log('Python Libraries in TypeScript with Elide');
  console.log('='.repeat(80));

  // NumPy Examples
  NumpyExamples.basicOperations();
  NumpyExamples.indexingSlicing();
  NumpyExamples.reshapingManipulation();
  NumpyExamples.mathematicalOperations();
  NumpyExamples.linearAlgebra();
  NumpyExamples.randomNumbers();

  // Pandas Examples
  PandasExamples.createDataFrames();
  PandasExamples.inspectDataFrame();
  PandasExamples.selectFilter();
  PandasExamples.groupAggregate();
  PandasExamples.cleanTransform();
  PandasExamples.mergeJoin();
  PandasExamples.timeSeries();

  // Visualization Examples
  VisualizationExamples.basicPlots();
  VisualizationExamples.statisticalPlots();
  VisualizationExamples.advancedVisualizations();

  // Machine Learning Examples
  MachineLearningExamples.classification();
  MachineLearningExamples.regression();
  MachineLearningExamples.clustering();

  // Statistical Analysis
  StatisticalAnalysis.statisticalTests();
  StatisticalAnalysis.distributions();

  console.log('\n' + '='.repeat(80));
  console.log('NOTEBOOK EXECUTION COMPLETE');
  console.log('='.repeat(80));
}

// Run the notebook
if (require.main === module) {
  main();
}

export {
  NumpyExamples,
  PandasExamples,
  VisualizationExamples,
  MachineLearningExamples,
  StatisticalAnalysis
};
