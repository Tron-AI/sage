from django.db.models import Q
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Product, OfficialCatalog, Homologation

class ProductMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1, 2), stop_words='english')
        self.model_trained = False
        self.official_products_vectors = None
        self.official_products = None
    
    def preprocess_text(self, text):
        return str(text or '').lower().strip()
    
    def combine_features(self, product):
        if isinstance(product, OfficialCatalog):
            return f"{product.name} {product.description} {product.category} {product.brand}"
        return f"{product.schema_name} {product.description} {product.domain}"
    
    def train(self):
        homologations = Homologation.objects.filter(
            Q(status='approved') | Q(confidence_score__gte=90)
        ).select_related('product', 'official_product')
        
        if not homologations:
            raise ValueError("No training data available")
        
        train_data = [
            self.preprocess_text(self.combine_features(h.product)) for h in homologations
        ] + [
            self.preprocess_text(self.combine_features(h.official_product)) for h in homologations
        ]
        
        self.vectorizer.fit(train_data)
        self.official_products = list(OfficialCatalog.objects.filter(is_active=True))
        self.official_products_vectors = self.vectorizer.transform([
            self.preprocess_text(self.combine_features(prod)) for prod in self.official_products
        ])
        self.model_trained = True
    
    def find_matches(self, product, top_n=5):
        if not self.model_trained:
            self.train()
        
        product_vector = self.vectorizer.transform([
            self.preprocess_text(self.combine_features(product))
        ])
        similarities = cosine_similarity(product_vector, self.official_products_vectors)[0]
        top_indices = np.argsort(similarities)[-top_n:][::-1]
        
        return [
            {
                'official_product': self.official_products[idx],
                'confidence_score': round(float(similarities[idx] * 100), 2)
            }
            for idx in top_indices
        ]