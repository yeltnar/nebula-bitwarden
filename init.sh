# cat /app/server && echo
# cat /app/email && echo
# cat /app/password && echo

# exit

bw config server $(cat /app/server)

email=$(cat /app/email)
passwordfile=/app/password

bw login $email --passwordfile "$passwordfile" --raw > /tmp/session_id

export BW_SESSION=$(cat /tmp/session_id)

bw serve --port 8087 --hostname localhost
