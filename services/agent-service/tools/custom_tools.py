"""
Custom Tools for NexusMind Agents
Additional capabilities beyond built-in Agno tools
"""

from agno.tools import Toolkit
from typing import Optional, List, Dict, Any
import json
import re


class TextAnalysisTools(Toolkit):
    """Tools for text analysis and processing"""
    
    def __init__(self):
        super().__init__(name="text_analysis_tools")
        self.register(self.count_words)
        self.register(self.extract_keywords)
        self.register(self.sentiment_analysis)
        self.register(self.readability_score)
    
    def count_words(self, text: str) -> Dict[str, int]:
        """Count words, sentences, and characters in text"""
        words = len(text.split())
        sentences = len(re.split(r'[.!?]+', text))
        characters = len(text)
        characters_no_spaces = len(text.replace(' ', ''))
        
        return {
            "words": words,
            "sentences": sentences,
            "characters": characters,
            "characters_no_spaces": characters_no_spaces,
            "avg_word_length": round(characters_no_spaces / words, 2) if words > 0 else 0
        }
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Extract top keywords from text (simple frequency-based)"""
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 
                     'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 
                     'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 
                     'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'}
        
        # Extract words
        words = re.findall(r'\b[a-z]+\b', text.lower())
        
        # Count frequency
        word_freq = {}
        for word in words:
            if word not in stop_words and len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Sort by frequency
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        return [word for word, freq in sorted_words[:top_n]]
    
    def sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Simple sentiment analysis based on keyword matching"""
        positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
                         'love', 'best', 'happy', 'joy', 'perfect', 'awesome', 'brilliant'}
        negative_words = {'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 
                         'disappointing', 'sad', 'angry', 'frustrating', 'annoying'}
        
        words = set(re.findall(r'\b[a-z]+\b', text.lower()))
        
        positive_count = len(words & positive_words)
        negative_count = len(words & negative_words)
        
        if positive_count > negative_count:
            sentiment = "positive"
            score = min(positive_count / (positive_count + negative_count + 1), 1.0)
        elif negative_count > positive_count:
            sentiment = "negative"
            score = -min(negative_count / (positive_count + negative_count + 1), 1.0)
        else:
            sentiment = "neutral"
            score = 0.0
        
        return {
            "sentiment": sentiment,
            "score": round(score, 2),
            "positive_words": positive_count,
            "negative_words": negative_count
        }
    
    def readability_score(self, text: str) -> Dict[str, Any]:
        """Calculate simple readability metrics"""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        
        if not words or not sentences:
            return {"error": "Text too short to analyze"}
        
        avg_word_length = sum(len(word) for word in words) / len(words)
        avg_sentence_length = len(words) / len(sentences)
        
        # Simple readability score (lower is easier)
        readability = (avg_word_length * 0.5) + (avg_sentence_length * 0.1)
        
        if readability < 5:
            level = "Very Easy"
        elif readability < 7:
            level = "Easy"
        elif readability < 9:
            level = "Medium"
        elif readability < 11:
            level = "Difficult"
        else:
            level = "Very Difficult"
        
        return {
            "readability_score": round(readability, 2),
            "level": level,
            "avg_word_length": round(avg_word_length, 2),
            "avg_sentence_length": round(avg_sentence_length, 2)
        }


class DataFormattingTools(Toolkit):
    """Tools for formatting and structuring data"""
    
    def __init__(self):
        super().__init__(name="data_formatting_tools")
        self.register(self.format_as_table)
        self.register(self.format_as_json)
        self.register(self.format_as_list)
    
    def format_as_table(self, data: List[Dict], columns: Optional[List[str]] = None) -> str:
        """Format data as a markdown table"""
        if not data:
            return "No data to format"
        
        if columns is None:
            columns = list(data[0].keys())
        
        # Create header
        header = "| " + " | ".join(columns) + " |"
        separator = "|" + "|".join(["---" for _ in columns]) + "|"
        
        # Create rows
        rows = []
        for item in data:
            row = "| " + " | ".join(str(item.get(col, "")) for col in columns) + " |"
            rows.append(row)
        
        return "\n".join([header, separator] + rows)
    
    def format_as_json(self, data: Any, indent: int = 2) -> str:
        """Format data as pretty JSON"""
        return json.dumps(data, indent=indent, ensure_ascii=False)
    
    def format_as_list(self, items: List[str], numbered: bool = True) -> str:
        """Format items as a markdown list"""
        if numbered:
            return "\n".join(f"{i+1}. {item}" for i, item in enumerate(items))
        else:
            return "\n".join(f"- {item}" for item in items)


class CalculationTools(Toolkit):
    """Tools for calculations and conversions"""
    
    def __init__(self):
        super().__init__(name="calculation_tools")
        self.register(self.calculate_percentage)
        self.register(self.calculate_growth_rate)
        self.register(self.convert_units)
    
    def calculate_percentage(self, part: float, whole: float) -> Dict[str, float]:
        """Calculate percentage"""
        if whole == 0:
            return {"error": "Cannot divide by zero"}
        
        percentage = (part / whole) * 100
        return {
            "percentage": round(percentage, 2),
            "decimal": round(part / whole, 4)
        }
    
    def calculate_growth_rate(self, old_value: float, new_value: float) -> Dict[str, float]:
        """Calculate growth rate between two values"""
        if old_value == 0:
            return {"error": "Cannot calculate growth from zero"}
        
        growth = ((new_value - old_value) / old_value) * 100
        return {
            "growth_rate": round(growth, 2),
            "absolute_change": round(new_value - old_value, 2),
            "multiplier": round(new_value / old_value, 2)
        }
    
    def convert_units(self, value: float, from_unit: str, to_unit: str) -> Optional[float]:
        """Convert between common units"""
        conversions = {
            # Length
            ('m', 'km'): 0.001,
            ('km', 'm'): 1000,
            ('m', 'cm'): 100,
            ('cm', 'm'): 0.01,
            ('km', 'mi'): 0.621371,
            ('mi', 'km'): 1.60934,
            
            # Weight
            ('kg', 'g'): 1000,
            ('g', 'kg'): 0.001,
            ('kg', 'lb'): 2.20462,
            ('lb', 'kg'): 0.453592,
            
            # Temperature
            ('c', 'f'): lambda x: (x * 9/5) + 32,
            ('f', 'c'): lambda x: (x - 32) * 5/9,
        }
        
        key = (from_unit.lower(), to_unit.lower())
        if key in conversions:
            conversion = conversions[key]
            if callable(conversion):
                return round(conversion(value), 2)
            else:
                return round(value * conversion, 2)
        
        return None


# Export all tools
def get_all_custom_tools() -> List[Toolkit]:
    """Get all custom tools"""
    return [
        TextAnalysisTools(),
        DataFormattingTools(),
        CalculationTools(),
    ]
