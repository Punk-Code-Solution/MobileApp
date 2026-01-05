/**
 * Funções utilitárias para formatação de dados
 */

/**
 * Formata data no formato DD/MM/YYYY
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formata horário no formato HH:MM
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formata data completa (dia da semana, dia de mês de ano)
 */
export const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${weekday}, ${day} de ${month} de ${year}`;
};

/**
 * Formata CPF no formato 000.000.000-00
 */
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      .replace(/\.$|-$/g, '');
  }
  return cpf;
};

/**
 * Formata valor monetário no formato R$ 0,00
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

