#!/usr/bin/env bash
# Uso: coloque este script na raiz do repo (onde está changes.patch) e execute:
# chmod +x apply_custom_patch.sh
# ./apply_custom_patch.sh changes.patch
PATCH_FILE="${1:-changes.patch}"
if [ ! -f "$PATCH_FILE" ]; then
  echo "Arquivo de patch não encontrado: $PATCH_FILE"
  exit 1
fi

OUTFILE=""
IN_FILE_BLOCK=0
IS_UPDATE=0

# Faz backup de segurança (opcional)
echo "Criando backup temporário do patch..."
cp "$PATCH_FILE" "$PATCH_FILE.bak"

# Processa o patch
while IFS= read -r line || [ -n "$line" ]; do
  # Detecta início de novo bloco de arquivo
  if [[ "$line" =~ ^\*\*\*\ (Add|Update)\ File:\ (.+)$ ]]; then
    IN_FILE_BLOCK=1
    TYPE="${BASH_REMATCH[1]}"
    OUTFILE="${BASH_REMATCH[2]}"
    IS_UPDATE=0
    if [[ "$TYPE" == "Update" ]]; then IS_UPDATE=1; fi
    # prepara diretório
    dir="$(dirname "$OUTFILE")"
    if [ ! -d "$dir" ]; then
      mkdir -p "$dir"
      echo "Criando diretório: $dir"
    fi
    # truncar arquivo de saída (escreveremos o conteúdo novo)
    > "$OUTFILE"
    # marcar que estamos no bloco atual (mas ainda aguardamos linhas +)
    continue
  fi

  # Se iniciou bloco e encontramos linha "*** End Patch" ou novo "*** Begin Patch", tratamos automaticamente pela detecção anterior
  # Se estamos dentro de bloco de arquivo, processar linhas que começam com '+'
  if [ "$IN_FILE_BLOCK" -eq 1 ]; then
    # Linha que inicia um novo "***" - indica fim do bloco corrente; retrocedemos um step
    if [[ "$line" =~ ^\*\*\*\ (Begin|End|Update|Add)\ .* ]]; then
      # re-processar esta linha no loop (não simples em bash), então apenas continue
      # mas como detectamos linhas Add/Update no topo, este caso será rarefeito
      :
    fi
    # Se a linha começa com '+', e NÃO é '+++' (marcador diff), grava o conteúdo sem o '+'
    if [[ "$line" == +* ]]; then
      # evitar linhas que sejam "+++" (marcador diff)
      if [[ "$line" =~ ^\+\+\+ ]]; then
        continue
      fi
      # remove o primeiro caractere '+' e escreva no arquivo
      echo "${line:1}" >> "$OUTFILE"
    fi
    # Também, caso exista bloco sem prefixo (possível), você pode querer capturar linhas sem +/-:
    # (opcional) Uncomment se necessário:
    # if [[ ! "$line" =~ ^[\+\-@] ]]; then
    #   echo "$line" >> "$OUTFILE"
    # fi
    # Detecta se próxima linha é o começo de outro bloco; aqui deixamos o loop continuar.
  fi
done < "$PATCH_FILE"

echo "Fim. Arquivos criados/atualizados. Revise-os antes de commitar."
echo "Verifique com: git status"