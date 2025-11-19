from __future__ import annotations

from pathlib import Path

from lark import Lark, Transformer

GRAMMAR_PATH = Path(__file__).with_name("grammar.lark")


class MetricTransformer(Transformer):
    def metric(self, items):  # noqa: D401 - lark entry point
        return {"metric": str(items[0]), "expression": items[1]}

    def identifier(self, token):
        return {"type": "identifier", "value": str(token[0])}

    def number(self, token):
        return {"type": "number", "value": float(token[0])}


_parser = Lark.open(str(GRAMMAR_PATH), parser="lalr", start="start", maybe_placeholders=False)


def parse_metric(dsl: str) -> dict:
    tree = _parser.parse(dsl)
    transformer = MetricTransformer()
    return transformer.transform(tree)
