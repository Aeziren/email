document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', function() {
    compose_email();
  });
  document.querySelector("#compose-form").addEventListener("submit", function(event) {
    event.preventDefault();
    send_mail()
  });
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(reply) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  const recipients = document.querySelector('#compose-recipients');
  const subject = document.querySelector('#compose-subject');
  const body = document.querySelector('#compose-body');

  console.log(reply);

  if (reply) {
    recipients.value = reply.sender;
    body.value = `On ${reply.timestamp} ${reply.sender} wrote: ${reply.body}`;
    if (reply.subject.startsWith("Re: ")) {
      subject.value = reply.subject;
    } else {
      subject.value = `Re: ${reply.subject}`;
    }
  } else {
    // Clear out composition fields
    recipients.value = "";
    subject.value = "";
    body.value = "";
  }

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Print emails
    console.log(emails);

    emails.forEach(function (email) {
      const email_field = document.createElement("div");
      email_field.addEventListener("click", function () {
        console.log(typeof(view_mail(email.id)));
      })

      email_field.id = "email_field";
      if (email.read) {
        email_field.classList.add("read");
      }
      email_field.innerHTML = `<span><strong>${email.sender}</strong></span>  <span id="subject">${email.subject}</span> <span id="timestamp">${email.timestamp}</span>`;
      document.querySelector("#emails-view").appendChild(email_field);
    })
});
}

function send_mail() {
  form = document.querySelector("#compose-form");
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: form.elements[1].value,
        subject: form.elements[2].value,
        body: form.elements[3].value
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox('sent')
  });
}

function view_mail(id) {
  const mail_view = document.createElement("div");
  document.querySelector("#emails-view").style.display = "none";

  // Mark email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });

  // Request data from backend
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    mail_view.innerHTML = `
    <div id="header-mail">
    <p><strong>From:</strong> ${email.sender}</p>
    <i class="fa-solid fa-box-archive fa-xl" id="archive-icon" style="color: #007bff;"></i>
    </div>
    <p><strong>To:</strong> ${email.recipients}</p>
    <p><strong>Subject:</strong> ${email.subject}</p>
    <p><strong>Timestamp:</strong> ${email.timestamp}</p>
    <button id="reply" class="btn btn-primary">Reply</button>
    <hr>
    <p>${email.body}</p>
    `
    // Show email to user
    document.querySelector("#mail-view").textContent = "";
    document.querySelector("#mail-view").appendChild(mail_view)
    document.querySelector("#mail-view").style.display = "block";

    // Archive button
    const archive_icon = document.querySelector("#archive-icon")
    const user = document.querySelector("#user").value
    if (user === email.sender) {
      archive_icon.style.display = "none";
    } else {
      archive_icon.addEventListener("click", function() {
        archive(email);
      });

    }

    // Reply button
    document.querySelector("#reply").addEventListener("click", function () {
      compose_email(email);
    })
  });
}

function archive(email) {
  if (!email.archived) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then(function () {
      load_mailbox('inbox')
    })
  } else {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then(function () {
      load_mailbox('inbox')
    })
  }
}
