import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()


def get_llm(temperature: float = 0.7, streaming: bool = True) -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("QWEN_MODEL", "qwen-plus"),
        api_key=os.getenv("DASHSCOPE_API_KEY"),
        base_url=os.getenv("DASHSCOPE_BASE_URL"),
        temperature=temperature,
        streaming=streaming,
    )
