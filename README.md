# Lpb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Cadastro com pagamento simulado

Para experimentar `/seja-socio` sem cobrança real, inicie a API com os perfis
`dev,local-payment-simulator`, sem token PagBank. Crie antes um banco PostgreSQL
separado chamado `lpb_simulacao` em `localhost:5432` e configure as credenciais
da API. O simulador exige esse banco e limita a API a `127.0.0.1`; não use dados
reais. Os cadastros desse banco não aparecem no banco normal.

Escolha PIX ou cartão e confirme pelo botão de simulação. Não há QR Code nem
cobrança verdadeira. No perfil `dev`, o código OTP é registrado no log da API;
o envio de e-mail depende da configuração de SMTP. Para receber pagamentos
verdadeiros, inicie a API sem o perfil do simulador e configure o PagBank.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
