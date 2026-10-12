// Calendar strings never pass through toISOString()/UTC when building DB timestamps.
export const japanDate = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const japanTime = (date: Date, seconds = false) => new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:seconds?'2-digit':undefined,hourCycle:'h23'}).format(date);
export const timestamp = (date: string, time: string) => `${date}T${time.length === 5 ? `${time}:00` : time}`;
export const nextCalendarDate = (date: string, delta: number) => {
    const value = new Date(`${date}T12:00:00`);
    value.setDate(value.getDate()+delta);
    return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
};
