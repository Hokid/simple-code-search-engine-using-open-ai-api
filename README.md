# Example of simple code search engine using Open AI API

## Installing

```
$ npm install
$ pip install -r requirements.txt
```

## Usage

1. Fill Open AI API token in `env.sh` and run `source env.sh` command
2. Run `create_search_db.py` to generate `search_db.csv` or use existing
3. Use `search.py` to search in code:

```
$ python search.py "Check type of content"
```