import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-politica-privacidade',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="container section">
      <h1>Política de privacidade</h1>
      <p><strong>Rascunho para desenvolvimento. Esta política ainda precisa de revisão e aprovação antes da publicação.</strong></p>
      <h2>Responsável informado</h2>
      <p>CLUB BAR 22 LTDA - ME, CNPJ 14.846.678/0001-02.</p>
      <h2>Cadastro de sócio</h2>
      <p>O formulário solicita nome, CPF, e-mail, senha, endereço e hospício para o cadastro de sócio.
      A consulta de CEP utiliza o serviço ViaCEP. O pagamento é processado pelo PagBank;
      os dados do cartão não são enviados ao nosso servidor.</p>
      <h2>Informações pendentes</h2>
      <p>O contato de privacidade, as finalidades, os prazos de conservação, os compartilhamentos e as
      orientações para exercer direitos ainda precisam ser definidos e revisados pelo responsável.</p>
    </article>
  `,
  styles: `article { display: grid; gap: 1.5rem; } h2 { font-size: 1.5rem; }`,
})
export class PoliticaPrivacidade {}
