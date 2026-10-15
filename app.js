const services = [
      { id: "banho", name: "Banho", duration: "1h", durationMinutes: 60, price: 60 },
      { id: "banho-tosa", name: "Banho e tosa", duration: "2h", durationMinutes: 120, price: 110 },
      { id: "hidratacao", name: "Hidratação", duration: "30 min", durationMinutes: 30, price: 40 },
      { id: "tosa-higienica", name: "Tosa higiênica", duration: "30 min", durationMinutes: 30, price: 45 }
    ];
    const serviceIcons = {
      banho: "🛁",
      "banho-tosa": "✂️",
      hidratacao: "✨",
      "tosa-higienica": "🐶"
    };

    const appointments = [];
    let nextAppointmentId = 1;
    const today = startOfDay(new Date());
    let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedService = services[0];
    let selectedDate = null;
    let selectedTime = null;

    const serviceGrid = document.querySelector("#service-grid");
    const calendarDays = document.querySelector("#calendar-days");
    const monthLabel = document.querySelector("#month-label");
    const prevMonthButton = document.querySelector("#prev-month");
    const nextMonthButton = document.querySelector("#next-month");
    const schedule = document.querySelector("#schedule");
    const timeHint = document.querySelector("#time-hint");
    const bookingForm = document.querySelector("#booking-form");
    const confirmButton = document.querySelector("#confirm-button");
    const successDialog = document.querySelector("#success-dialog");
    const appointmentsDialog = document.querySelector("#appointments-dialog");
    const appointmentsList = document.querySelector("#appointments-list");
    const appointmentsTrigger = document.querySelector("#appointments-trigger");

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function sameDay(a, b) {
      return Boolean(a && b) &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    }

    function localDateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function money(value) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    }

    function longDate(date) {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long", day: "2-digit", month: "long"
      }).format(date);
    }

    function timeToMinutes(time) {
      const [hour, minute] = time.split(":").map(Number);
      return hour * 60 + minute;
    }

    function formatMinutes(totalMinutes) {
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    function dateFromKey(dateKey) {
      const [year, month, day] = dateKey.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    function appointmentStartDate(appointment) {
      const date = dateFromKey(appointment.dateKey);
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        Math.floor(appointment.startMinutes / 60),
        appointment.startMinutes % 60
      );
    }

    function futureAppointments() {
      const now = new Date();
      return appointments
        .filter((appointment) => appointmentStartDate(appointment).getTime() >= now.getTime())
        .sort((a, b) => appointmentStartDate(a) - appointmentStartDate(b));
    }

    function nextBusinessDates(quantity) {
      const dates = [];
      const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      while (dates.length < quantity) {
        if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
          dates.push(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()));
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return dates;
    }

    function seedExampleAppointments() {
      const dates = nextBusinessDates(6);
      const examples = [
        { serviceId: "banho", time: "09:00", tutorName: "Marina Alves", petName: "Luna", phone: "(11) 90000-0001" },
        { serviceId: "banho-tosa", time: "13:00", tutorName: "Rafael Costa", petName: "Thor", phone: "(11) 90000-0002" },
        { serviceId: "hidratacao", time: "10:30", tutorName: "Camila Nunes", petName: "Mel", phone: "(11) 90000-0003" },
        { serviceId: "tosa-higienica", time: "15:00", tutorName: "Bruno Lima", petName: "Bento", phone: "(11) 90000-0004" },
        { serviceId: "banho-tosa", time: "09:30", tutorName: "Lívia Martins", petName: "Nina", phone: "(11) 90000-0005" },
        { serviceId: "banho", time: "16:30", tutorName: "Diego Souza", petName: "Pipoca", phone: "(11) 90000-0006" }
      ];

      examples.forEach((example, index) => {
        const service = services.find((item) => item.id === example.serviceId);
        const startMinutes = timeToMinutes(example.time);
        appointments.push({
          id: nextAppointmentId++,
          dateKey: localDateKey(dates[index]),
          startMinutes,
          endMinutes: startMinutes + service.durationMinutes,
          service: service.name,
          price: service.price,
          tutorName: example.tutorName,
          petName: example.petName,
          phone: example.phone
        });
      });
    }

    function renderAppointments() {
      const future = futureAppointments();
      const totalValue = future.reduce((sum, appointment) => sum + appointment.price, 0);
      const badge = document.querySelector("#appointments-count-badge");

      document.querySelector("#appointments-total-count").textContent = future.length;
      document.querySelector("#appointments-total-value").textContent = money(totalValue);
      badge.textContent = future.length;
      badge.setAttribute("aria-label", `${future.length} ${future.length === 1 ? "agendamento" : "agendamentos"}`);
      appointmentsList.innerHTML = "";

      if (!future.length) {
        appointmentsList.innerHTML = `
          <div class="appointments-empty">
            <span aria-hidden="true">🐾</span>
            <strong>Nenhum agendamento por aqui</strong>
            Escolha um serviço, uma data e um horário para começar.
          </div>
        `;
        return;
      }

      future.forEach((appointment) => {
        const item = document.createElement("article");
        item.className = "appointment-item";

        const content = document.createElement("div");
        const mainline = document.createElement("div");
        mainline.className = "appointment-mainline";
        const title = document.createElement("h3");
        title.textContent = appointment.service;
        const price = document.createElement("span");
        price.className = "appointment-price";
        price.textContent = money(appointment.price);
        mainline.appendChild(title);
        mainline.appendChild(price);

        const details = document.createElement("div");
        details.className = "appointment-details";
        [
          `📅 ${longDate(dateFromKey(appointment.dateKey))}`,
          `🕘 ${formatMinutes(appointment.startMinutes)}–${formatMinutes(appointment.endMinutes)}`,
          `Tutor: ${appointment.tutorName}`,
          `Pet: ${appointment.petName}`
        ].forEach((value) => {
          const detail = document.createElement("span");
          detail.className = "appointment-detail";
          detail.textContent = value;
          details.appendChild(detail);
        });
        content.appendChild(mainline);
        content.appendChild(details);

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "cancel-appointment";
        cancelButton.textContent = "Cancelar";
        cancelButton.setAttribute("aria-label", `Cancelar ${appointment.service} de ${appointment.petName}`);
        cancelButton.addEventListener("click", () => {
          const confirmed = window.confirm(
            `Cancelar o agendamento de ${appointment.petName} em ${longDate(dateFromKey(appointment.dateKey))}, às ${formatMinutes(appointment.startMinutes)}?`
          );
          if (!confirmed) return;

          const index = appointments.findIndex((item) => item.id === appointment.id);
          if (index !== -1) appointments.splice(index, 1);
          renderAppointments();
          if (selectedDate && localDateKey(selectedDate) === appointment.dateKey) renderSchedule();
        });

        item.appendChild(content);
        item.appendChild(cancelButton);
        appointmentsList.appendChild(item);
      });
    }

    function slotStatus(date, startMinutes) {
      const endMinutes = startMinutes + selectedService.durationMinutes;

      if (endMinutes > 18 * 60) {
        return { available: false, occupied: false, reason: "O serviço terminaria após as 18h" };
      }

      const crossesLunch = startMinutes < 13 * 60 && endMinutes > 12 * 60;
      if (crossesLunch) {
        return { available: false, occupied: false, reason: "O serviço atravessaria o horário de almoço" };
      }

      const dateKey = localDateKey(date);
      const hasConflict = appointments.some((appointment) =>
        appointment.dateKey === dateKey &&
        startMinutes < appointment.endMinutes &&
        endMinutes > appointment.startMinutes
      );

      if (hasConflict) {
        return { available: false, occupied: true, reason: "Horário ocupado" };
      }

      return { available: true, occupied: false, reason: "Disponível" };
    }

    function renderServices() {
      serviceGrid.innerHTML = "";
      services.forEach((service) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `service-card${service.id === selectedService.id ? " selected" : ""}`;
        button.setAttribute("aria-pressed", String(service.id === selectedService.id));
        button.innerHTML = `
          <span class="service-check" aria-hidden="true">✓</span>
          <span class="service-icon" aria-hidden="true">${serviceIcons[service.id]}</span>
          <span class="service-name">${service.name}</span>
          <span class="service-meta"><span>${service.duration}</span><span class="service-price">${money(service.price)}</span></span>
        `;
        button.addEventListener("click", () => {
          selectedService = service;
          if (selectedDate && selectedTime && !slotStatus(selectedDate, timeToMinutes(selectedTime)).available) {
            selectedTime = null;
          }
          renderServices();
          renderSchedule();
          updateSummary();
        });
        serviceGrid.appendChild(button);
      });
    }

    function renderCalendar() {
      const year = visibleMonth.getFullYear();
      const month = visibleMonth.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      monthLabel.textContent = new Intl.DateTimeFormat("pt-BR", {
        month: "long", year: "numeric"
      }).format(visibleMonth);

      calendarDays.innerHTML = "";

      for (let i = 0; i < firstWeekday; i += 1) {
        const spacer = document.createElement("span");
        spacer.className = "day empty";
        spacer.setAttribute("aria-hidden", "true");
        calendarDays.appendChild(spacer);
      }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const isPast = startOfDay(date) < today;
        const isSunday = date.getDay() === 0;
        const isToday = sameDay(date, today);
        const isSelected = sameDay(date, selectedDate);
        const button = document.createElement("button");

        button.type = "button";
        button.className = `day${isToday ? " today" : ""}${isSelected ? " selected" : ""}`;
        button.textContent = day;
        button.disabled = isPast || isSunday;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-selected", String(isSelected));
        button.setAttribute("data-date", localDateKey(date));
        button.setAttribute("aria-label", `${longDate(date)}${isSunday ? ", indisponível" : ""}${isPast ? ", data passada" : ""}`);

        button.addEventListener("click", () => {
          selectedDate = new Date(year, month, day);
          selectedTime = null;
          renderCalendar();
          renderSchedule();
          updateSummary();
        });
        calendarDays.appendChild(button);
      }

      prevMonthButton.disabled = year === today.getFullYear() && month === today.getMonth();
    }

    function availableTimes(date, referenceTime = new Date()) {
      if (!date) return [];
      const slots = [];

      for (let minutes = 9 * 60; minutes <= 18 * 60; minutes += 30) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        if (hour === 12) continue;

        const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
        if (sameDay(date, referenceTime) && slotDate.getTime() < referenceTime.getTime()) continue;
        slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
      }
      return slots;
    }

    function renderSchedule() {
      schedule.innerHTML = "";

      if (!selectedDate) {
        schedule.innerHTML = `<div class="schedule-empty"><div><strong>Nenhuma data selecionada</strong>Escolha um dia disponível no calendário.</div></div>`;
        timeHint.textContent = "Atendimento das 9h às 18h, com pausa para almoço.";
        return;
      }

      const times = availableTimes(selectedDate);
      timeHint.textContent = `Horários para ${longDate(selectedDate)}.`;

      if (!times.length) {
        schedule.innerHTML = `<div class="schedule-empty"><div><strong>Sem horários restantes</strong>Escolha outra data no calendário.</div></div>`;
        return;
      }

      const grid = document.createElement("div");
      grid.className = "time-grid";
      grid.setAttribute("aria-label", `Horários disponíveis para ${longDate(selectedDate)}`);

      times.forEach((time) => {
        const status = slotStatus(selectedDate, timeToMinutes(time));
        const button = document.createElement("button");
        button.type = "button";
        button.className = `time-button${time === selectedTime ? " selected" : ""}${status.occupied ? " occupied" : ""}`;
        button.textContent = time;
        button.disabled = !status.available;
        button.title = status.reason;
        button.setAttribute("aria-pressed", String(time === selectedTime));
        button.setAttribute("aria-label", `${time}, ${status.reason}`);
        button.addEventListener("click", () => {
          selectedTime = time;
          renderSchedule();
          updateSummary();
        });
        grid.appendChild(button);
      });
      schedule.appendChild(grid);
    }

    function updateSummary() {
      const dateElement = document.querySelector("#summary-date");
      const timeElement = document.querySelector("#summary-time");

      document.querySelector("#summary-service").textContent = `${selectedService.name} · ${selectedService.duration}`;
      document.querySelector("#summary-price").textContent = money(selectedService.price);

      dateElement.textContent = selectedDate ? longDate(selectedDate) : "Escolha uma data";
      dateElement.classList.toggle("placeholder", !selectedDate);
      timeElement.textContent = selectedTime || "Escolha um horário";
      timeElement.classList.toggle("placeholder", !selectedTime);
      const isReady = Boolean(selectedService && selectedDate && selectedTime);
      bookingForm.hidden = !isReady;
      confirmButton.disabled = !isReady;
    }

    prevMonthButton.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    nextMonthButton.addEventListener("click", () => {
      visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!selectedDate || !selectedTime) return;

      const fields = [
        document.querySelector("#tutor-name"),
        document.querySelector("#pet-name"),
        document.querySelector("#phone")
      ];
      fields.forEach((field) => field.setCustomValidity(field.value.trim() ? "" : "Preencha este campo."));
      if (!bookingForm.reportValidity()) return;

      const startMinutes = timeToMinutes(selectedTime);
      const status = slotStatus(selectedDate, startMinutes);
      if (!status.available) {
        selectedTime = null;
        renderSchedule();
        updateSummary();
        return;
      }

      const endMinutes = startMinutes + selectedService.durationMinutes;
      const appointment = {
        id: nextAppointmentId++,
        dateKey: localDateKey(selectedDate),
        startMinutes,
        endMinutes,
        service: selectedService.name,
        price: selectedService.price,
        tutorName: fields[0].value.trim(),
        petName: fields[1].value.trim(),
        phone: fields[2].value.trim()
      };
      appointments.push(appointment);

      document.querySelector("#confirmation-service").textContent = appointment.service;
      document.querySelector("#confirmation-date").textContent = longDate(selectedDate);
      document.querySelector("#confirmation-time").textContent = `${formatMinutes(startMinutes)}–${formatMinutes(endMinutes)}`;
      document.querySelector("#confirmation-price").textContent = money(appointment.price);

      bookingForm.reset();
      fields.forEach((field) => field.setCustomValidity(""));
      selectedTime = null;
      renderSchedule();
      updateSummary();
      renderAppointments();
      successDialog.showModal();
    });

    ["#tutor-name", "#pet-name", "#phone"].forEach((selector) => {
      document.querySelector(selector).addEventListener("input", (event) => event.target.setCustomValidity(""));
    });

    document.querySelector("#dialog-close").addEventListener("click", () => successDialog.close());
    successDialog.addEventListener("click", (event) => {
      if (event.target === successDialog) successDialog.close();
    });

    appointmentsTrigger.addEventListener("click", () => {
      renderAppointments();
      appointmentsDialog.showModal();
    });
    document.querySelector("#appointments-close").addEventListener("click", () => appointmentsDialog.close());
    appointmentsDialog.addEventListener("click", (event) => {
      if (event.target === appointmentsDialog) appointmentsDialog.close();
    });

    seedExampleAppointments();
    renderServices();
    renderCalendar();
    renderSchedule();
    updateSummary();
    renderAppointments();

