from io import StringIO
from subprocess import PIPE, run
from pandas import read_csv
from openai.embeddings_utils import get_embedding as _get_embedding
from tenacity import wait_random_exponential, stop_after_attempt

get_embedding = _get_embedding.retry_with(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(10))

result = run(['node', 'code-to-csv.js'], stdout=PIPE, stderr=PIPE, universal_newlines=True)

if result.returncode != 0:
    raise RuntimeError(result.stderr)

db = read_csv(StringIO(result.stdout))
db['embedding'] = db['combined'].apply(lambda x: get_embedding(x, engine='text-embedding-ada-002'))
db.to_csv("search_db.csv", index=False)