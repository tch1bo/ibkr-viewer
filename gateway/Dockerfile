FROM eclipse-temurin:21-jre

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /root/clientportal

# Download and extract IBKR Client Portal Gateway
# The zip extracts a clientportal.gw/ directory; move contents to working dir
RUN curl -sSL -o /tmp/clientportal.gw.zip \
        https://download2.interactivebrokers.com/portal/clientportal.gw.zip \
    && unzip -o /tmp/clientportal.gw.zip -d /tmp/gw \
    && cp -r /tmp/gw/clientportal.gw/* /root/clientportal/ || cp -r /tmp/gw/* /root/clientportal/ \
    && rm -rf /tmp/clientportal.gw.zip /tmp/gw \
    && chmod +x /root/clientportal/bin/run.sh

# Copy startup script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the gateway port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -k -f https://localhost:5000/v1/api/one/user || exit 1

ENTRYPOINT ["/entrypoint.sh"]
