# Contribuindo para o Staffcare

Ficamos muito felizes pelo seu interesse em contribuir! Para manter o código limpo, consistente e seguro, siga as diretrizes abaixo:

## Padrões de Código

1.  **TypeScript**: O modo estrito (`strict`) está ativado. Evite usar `any` e sempre defina interfaces claras.
2.  **Segurança (RLS)**: Nunca ignore o RLS nas consultas Supabase no lado cliente.
3.  **Componentes**: Dê preferência a Server Components para renderização estática e "use client" apenas para componentes com estado ou interatividade do navegador.

## Fluxo de Trabalho Git

1.  Crie uma branch de funcionalidade a partir da `develop`:
    ```bash
    git checkout -b feature/sua-funcionalidade
    ```
2.  Submeta um Pull Request descrevendo suas alterações.
3.  A branch `main` é exclusiva para deploy de produção na Hostinger.
