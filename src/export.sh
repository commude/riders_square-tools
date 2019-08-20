/bin/bash <<'SCRIPT'
while : ; do
  aws cognito-idp list-users --user-pool-id ap-northeast-1_YNFdMqgAm $tokenopt | tee tmp | jq -r '.Users[] | [.Username,.Enabled,.UserStatus,.UserCreateDate,.Attributes[].Value] | @tsv' >> users.tsv
  token=`jq -r '.PaginationToken' tmp`
  if [ "$token" == "null" ]; then break; else tokenopt="--pagination-token $token"; fi
done
rm tmp
SCRIPT
