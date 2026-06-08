function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getWeekdayName(): string {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long" });
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export { getGreeting, getWeekdayName, getFormattedDate };
