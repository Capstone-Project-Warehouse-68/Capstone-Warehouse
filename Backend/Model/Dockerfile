FROM python:3.11-slim

WORKDIR /app

# copy requirements (ชื่อไฟล์ใน repo: Result/requirment.txt)
COPY Result/requirment.txt ./requirements.txt

# install dependencies (fail build ถ้า install ไม่สำเร็จ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
 && rm -rf /var/lib/apt/lists/* \
 && python -m pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# copy app
COPY . .

# ensure ServiceAcc dir exists so docker-compose can mount into it
RUN mkdir -p /app/ServiceAcc || true

# expose port (ให้สอดคล้องกับ main.py)
EXPOSE 8001

CMD ["python", "Result/main.py"]