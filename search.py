import sys
import numpy as np
from pandas import read_csv
from openai.embeddings_utils import cosine_similarity, get_embedding as _get_embedding
from tenacity import  stop_after_attempt, wait_random_exponential

get_embedding = _get_embedding.retry_with(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(10))

def search(db, query):
    query_embedding = get_embedding(query, engine='text-embedding-ada-002')
    db['similarities'] = db.embedding.apply(lambda x: cosine_similarity(x, query_embedding))
    db.sort_values('similarities', ascending=False, inplace=True)
    result = db.head(3)
    text = ""
    for row in result.itertuples(index=False):
        score=round(row.similarities, 3)
        if type(row.docs) == str:
            text += '/**\n * {docs}\n */\n'.format(docs='\n * '.join(row.docs.split('\n')))
        text += '{code}\n\n'.format(code='\n'.join(row.code.split('\n')[:7]))
        text += '[score={score}] {file_name}:{name}\n'.format(score=score, file_name=row.file_name, name=row.name)
        text += '-' * 70 + '\n\n'
    return text

if __name__ == '__main__':
    db = read_csv('search_db.csv')
    db['embedding'] = db.embedding.apply(eval).apply(np.array)
    query = sys.argv[1]
    print('')
    print(search(db, query))