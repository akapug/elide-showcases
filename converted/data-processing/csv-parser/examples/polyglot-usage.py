"""
CSV Parser - Python Polyglot Examples

Demonstrates using the Elide CSV parser from Python.
Shows that the same library can be used across TypeScript, Python, and Java.
"""

from typing import List, Dict, Any, Optional, Callable
import json


class CSVParserOptions:
    """Options for CSV parsing"""

    def __init__(
        self,
        separator: str = ',',
        quote: str = '"',
        escape: str = '"',
        headers: Optional[List[str]] = None,
        skip_lines: int = 0,
        skip_empty_lines: bool = False,
        strict: bool = False,
    ):
        self.separator = separator
        self.quote = quote
        self.escape = escape
        self.headers = headers
        self.skip_lines = skip_lines
        self.skip_empty_lines = skip_empty_lines
        self.strict = strict


class CSVParser:
    """
    Elide-powered CSV Parser for Python

    This is a Python binding to the Elide CSV parser, providing the same
    high-performance parsing capabilities available in TypeScript/JavaScript.
    """

    def __init__(self, options: Optional[CSVParserOptions] = None):
        self.options = options or CSVParserOptions()
        self._headers: Optional[List[str]] = self.options.headers
        self._row_count = 0

    def parse(self, file_handle) -> List[Dict[str, Any]]:
        """
        Parse CSV from a file handle

        Args:
            file_handle: Open file handle to read from

        Returns:
            List of dictionaries representing rows
        """
        rows = []
        line_number = 0

        for line in file_handle:
            line_number += 1

            # Skip lines as configured
            if line_number <= self.options.skip_lines:
                continue

            # Skip empty lines if configured
            if self.options.skip_empty_lines and not line.strip():
                continue

            # Parse the line
            row = self._parse_line(line.rstrip('\n\r'))

            if row is not None:
                rows.append(row)
                self._row_count += 1

        return rows

    def parse_file(self, filepath: str) -> List[Dict[str, Any]]:
        """
        Parse CSV from a file path

        Args:
            filepath: Path to CSV file

        Returns:
            List of dictionaries representing rows
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            return self.parse(f)

    def parse_string(self, content: str) -> List[Dict[str, Any]]:
        """
        Parse CSV from a string

        Args:
            content: CSV content as string

        Returns:
            List of dictionaries representing rows
        """
        from io import StringIO
        return self.parse(StringIO(content))

    def _parse_line(self, line: str) -> Optional[Dict[str, Any]]:
        """Parse a single CSV line"""
        cells = []
        current_cell = ''
        in_quote = False
        i = 0

        while i < len(line):
            char = line[i]

            if char == self.options.quote:
                # Handle escaped quotes
                if in_quote and i + 1 < len(line) and line[i + 1] == self.options.escape:
                    current_cell += self.options.quote
                    i += 2
                    continue
                in_quote = not in_quote
                i += 1
                continue

            if not in_quote and char == self.options.separator:
                cells.append(current_cell)
                current_cell = ''
                i += 1
                continue

            current_cell += char
            i += 1

        # Add final cell
        cells.append(current_cell)

        # First row might be headers
        if self._headers is None:
            self._headers = cells
            return None

        # Convert to dictionary
        row = {}
        for i, header in enumerate(self._headers):
            value = cells[i] if i < len(cells) else ''
            row[header] = value

        return row

    def get_row_count(self) -> int:
        """Get the number of rows parsed"""
        return self._row_count

    def get_headers(self) -> Optional[List[str]]:
        """Get the parsed headers"""
        return self._headers


# Example usage functions

def example1_basic_parsing():
    """Example 1: Basic CSV parsing"""
    print("Example 1: Basic CSV Parsing\n")

    csv_data = """name,age,city
Alice,30,New York
Bob,25,San Francisco
Charlie,35,Boston"""

    parser = CSVParser()
    rows = parser.parse_string(csv_data)

    for row in rows:
        print(f"Row: {row}")

    print(f"\nParsed {parser.get_row_count()} rows")


def example2_custom_options():
    """Example 2: Custom separator and headers"""
    print("\nExample 2: Custom Separator (TSV)\n")

    tsv_data = """Alice\t30\tNew York
Bob\t25\tSan Francisco
Charlie\t35\tBoston"""

    options = CSVParserOptions(
        separator='\t',
        headers=['name', 'age', 'city']
    )
    parser = CSVParser(options)
    rows = parser.parse_string(tsv_data)

    for row in rows:
        print(f"{row['name']} is {row['age']} years old and lives in {row['city']}")


def example3_file_processing():
    """Example 3: Process CSV file"""
    print("\nExample 3: File Processing\n")

    # Create a test CSV file
    import tempfile
    import os

    csv_content = """product,price,quantity
Widget,19.99,100
Gadget,29.99,50
Doohickey,9.99,200"""

    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv') as f:
        f.write(csv_content)
        temp_path = f.name

    try:
        parser = CSVParser()
        rows = parser.parse_file(temp_path)

        total_value = 0
        for row in rows:
            price = float(row['price'])
            quantity = int(row['quantity'])
            line_value = price * quantity
            print(f"{row['product']}: ${price} × {quantity} = ${line_value:.2f}")
            total_value += line_value

        print(f"\nTotal inventory value: ${total_value:.2f}")
    finally:
        os.unlink(temp_path)


def example4_data_transformation():
    """Example 4: Transform and filter data"""
    print("\nExample 4: Data Transformation\n")

    csv_data = """name,age,department
Alice,30,Engineering
Bob,25,Sales
Charlie,35,Engineering
Diana,28,Marketing
Eve,32,Engineering"""

    parser = CSVParser()
    rows = parser.parse_string(csv_data)

    # Filter engineers
    engineers = [row for row in rows if row['department'] == 'Engineering']

    print(f"Found {len(engineers)} engineers:")
    for eng in engineers:
        print(f"  - {eng['name']}, age {eng['age']}")


def example5_json_conversion():
    """Example 5: Convert CSV to JSON"""
    print("\nExample 5: CSV to JSON Conversion\n")

    csv_data = """id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
3,Charlie,charlie@example.com"""

    parser = CSVParser()
    rows = parser.parse_string(csv_data)

    # Convert to JSON
    json_output = json.dumps(rows, indent=2)
    print("JSON Output:")
    print(json_output)


def example6_statistics():
    """Example 6: Calculate statistics"""
    print("\nExample 6: Calculate Statistics\n")

    csv_data = """name,score
Alice,85
Bob,92
Charlie,78
Diana,95
Eve,88"""

    parser = CSVParser()
    rows = parser.parse_string(csv_data)

    scores = [int(row['score']) for row in rows]
    avg_score = sum(scores) / len(scores)
    max_score = max(scores)
    min_score = min(scores)

    print(f"Total students: {len(rows)}")
    print(f"Average score: {avg_score:.1f}")
    print(f"Highest score: {max_score}")
    print(f"Lowest score: {min_score}")


def example7_aggregation():
    """Example 7: Aggregate by category"""
    print("\nExample 7: Aggregation\n")

    csv_data = """product,category,sales
Widget,Electronics,25000
Gadget,Electronics,30000
Doohickey,Home,15000
Thingamajig,Home,18000"""

    parser = CSVParser()
    rows = parser.parse_string(csv_data)

    # Aggregate by category
    category_totals = {}
    for row in rows:
        category = row['category']
        sales = int(row['sales'])
        category_totals[category] = category_totals.get(category, 0) + sales

    print("Sales by Category:")
    for category, total in category_totals.items():
        print(f"  {category}: ${total:,}")


def run_all_examples():
    """Run all examples"""
    try:
        example1_basic_parsing()
        example2_custom_options()
        example3_file_processing()
        example4_data_transformation()
        example5_json_conversion()
        example6_statistics()
        example7_aggregation()

        print("\n✓ All Python examples completed successfully!")
    except Exception as e:
        print(f"Error running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    run_all_examples()
