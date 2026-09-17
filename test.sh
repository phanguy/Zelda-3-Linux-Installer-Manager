echo "0 is $0"
if [ -s "$0" ] && [ "$0" != "bash" ] && [[ "$0" != /dev/fd/* ]] && [[ "$0" != /proc/* ]]; then
    echo "IF BRANCH"
else
    echo "ELSE BRANCH"
fi
