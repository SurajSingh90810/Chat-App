(function ($) {
  "use strict";

  var fullHeight = function () {
    $(".js-fullheight").css("height", $(window).height());
    $(window).resize(function () {
      $(".js-fullheight").css("height", $(window).height());
    });
  };
  fullHeight();

  $("#sidebarCollapse").on("click", function () {
    $("#sidebar").toggleClass("active");
  });

  function getCookie(name) {
    let matches = document.cookie.match(
      new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
      )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  var userData = JSON.parse(getCookie("user"));
  var sender_id = userData._id;
  var receiver_id;
  var socket = io("/user-namespace", {
    auth: {
      token: userData._id,
    },
  });

  $(document).ready(function () {
    $(".user-list").click(function () {
      var userId = $(this).attr("data-id");
      receiver_id = userId;
      $(".start-head").hide();
      $(".chat-section").show();

      socket.emit("existsChat", {
        sender_id: sender_id,
        receiver_id: receiver_id,
      });
    });

    $("#chat-form").submit(function (event) {
      event.preventDefault();
      var message = $("#message").val();

      $.ajax({
        url: "/save-chat",
        type: "POST",
        data: {
          sender_id: sender_id,
          receiver_id: receiver_id,
          message: message,
        },
        success: function (response) {
          if (response.success) {
            $("#message").val("");
            let chat = response.data.message;
            let html = `
              <div class="current-user-chat" id="${response.data._id}">
                <h5>
                  <span>${chat}</span>
                  <i class="fa fa-trash" aria-hidden="true" data-id="${response.data._id}" data-toggle="modal" data-target="#deleteChatModal"></i>
                  <i class="fa fa-edit" aria-hidden="true" data-id="${response.data._id}" data-msg="${chat}" data-toggle="modal" data-target="#editChatModal"></i>
                </h5>
              </div>
            `;
            $("#chat-container").append(html);
            socket.emit("newChat", response.data);
            scrollChat();
          } else {
            alert(response.msg);
          }
        },
        error: function (xhr, status, error) {
          console.error("AJAX Error:", error);
        },
      });
    });
  });

  socket.on("getOnlineUser", function (data) {
    $("#" + data.user_id + "-status")
      .text("Online")
      .removeClass("offline-status")
      .addClass("online-status");
  });

  socket.on("getOfflineUser", function (data) {
    $("#" + data.user_id + "-status")
      .text("Offline")
      .addClass("offline-status")
      .removeClass("online-status");
  });

  socket.on("loadNewChat", function (data) {
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
      let html = `
        <div class="distance-user-chat" id="${data._id}">
          <h5>${data.message}</h5>
        </div>`;
      $("#chat-container").append(html);
    }
    scrollChat();
  });

  socket.on("loadChats", function (data) {
    $("#chat-container").html("");
    var chats = data.chats;
    let html = "";

    for (let x = 0; x < chats.length; x++) {
      let addClass = chats[x]["sender_id"] == sender_id ? "current-user-chat" : "distance-user-chat";

      html += `
        <div class="${addClass}" id="${chats[x]["_id"]}">
          <h5>
            <span>${chats[x]["message"]}</span>`;

      if (chats[x]["sender_id"] == sender_id) {
        html += `
          <i class="fa fa-trash" aria-hidden="true" data-id="${chats[x]["_id"]}" data-toggle="modal" data-target="#deleteChatModal"></i>
          <i class="fa fa-edit" aria-hidden="true" data-id="${chats[x]["_id"]}" data-msg="${chats[x]["message"]}" data-toggle="modal" data-target="#editChatModal"></i>`;
      }

      html += `</h5></div>`;
    }

    $("#chat-container").append(html);
    scrollChat();
  });

  function scrollChat() {
    const chatContainer = $("#chat-container")[0];
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  $(document).on("click", ".fa-trash", function () {
    let msg = $(this).parent().text();
    $("#delete-message").text(msg);
    $("#delete-message-id").val($(this).attr("data-id"));
  });

  $("#delete-chat-form").submit(function (event) {
    event.preventDefault();
    var id = $("#delete-message-id").val();

    $.ajax({
      url: "/delete-chat",
      type: "POST",
      data: { id: id },
      success: function (res) {
        if (res.success === true) {
          $("#" + CSS.escape(id)).remove();
          $("#deleteChatModal").modal("hide");
          socket.emit("chatDeleted", id);
        } else {
          alert(res.msg);
        }
      },
      error: function (xhr, status, error) {
        console.error("Delete AJAX Error:", error);
      },
    });
  });

  socket.on("chatMessageDeleted", function (id) {
    $("#" + id).remove();
  });

  $(document).on("click", ".fa-edit", function () {
    $("#edit-message-id").val($(this).attr("data-id"));
    $("#update-message").val($(this).attr("data-msg"));
  });

  $("#update-chat-form").submit(function (event) {
    event.preventDefault();
    var id = $("#edit-message-id").val();
    var msg = $("#update-message").val();

    $.ajax({
      url: "/update-chat",
      type: "POST",
      data: { id: id, message: msg },
      success: function (res) {
        if (res.success === true) {
          $("#" + id).find("span").text(msg);
          $("#" + id).find(".fa-edit").attr("data-msg", msg);
          $("#editChatModal").modal("hide");
          socket.emit("chatUpdated", { id: id, message: msg });
        } else {
          alert(res.msg);
        }
      },
    });
  });

  socket.on("chatMessageUpdated", function (data) {
    $("#" + data.id).find("span").text(data.message);
  });

  $(".addMember").click(function () {
    var id = $(this).attr("data-id");
    var limit = $(this).attr("data-limit");

    $("#group_id").val(id);
    $("#limit").val(limit);

    $.ajax({
      url: "/get-members",
      type: "POST",
      data: { group_id: id },
      success: function (res) {
        if (res.success && res.data) {
          let html = "";
          res.data.forEach((user) => {
            let isMember = user.member && user.member.length > 0;
            html += `<tr>
              <td><input type="checkbox" ${isMember ? "checked" : ""} name="members[]" value="${user._id}" /></td>
              <td>${user.name || "No Name"}</td>
            </tr>`;
          });
          $(".addMembersInTable").html(html);
        }
      },
      error: function (xhr, status, error) {
        console.error("AJAX error:", error);
      },
    });
  });

  $("#add-member-form").submit(function (event) {
    event.preventDefault();

    var formData = $(this).serialize();
    $.ajax({
      url: "/add-members",
      type: "POST",
      data: formData,
      success: function (res) {
        if (res.success) {
          $("#memberModal").modal("hide");
          $("#add-member-form")[0].reset();
        } else {
          $("#add-member-error").text(res.msg);
          setTimeout(() => {
            $("#add-member-error").text("");
          }, 3000);
        }
      },
    });
  });

  $(".updateMember").click(function () {
    var obj = JSON.parse($(this).attr("data-obj"));

    $("#update_group_id").val(obj._id);
    $("#last_limit").val(obj.limit);
    $("#group_name").val(obj.name);
    $("#group_limit").val(obj.limit);
  });

  $("#updateChatGroupForm").submit(function (e) {
    e.preventDefault();

    $.ajax({
      url: "/update-chat-group",
      type: "POST",
      data: new FormData(this),
      contentType: false,
      cache: false,
      processData: false,
      success: function (res) {
        if (res.success) {
          location.reload();
        }
      },
    });
  });

  $(".deleteGroup").click(function () {
    $("#delete_group_id").val($(this).attr("data-id"));
    $("#delete_group_name").text($(this).attr("data-name"));
  });

  $("#deleteChatGroupForm").submit(function (e) {
    e.preventDefault();

    var formData = $(this).serialize();

    $.ajax({
      url: "/delete-chat-group",
      type: "POST",
      data: formData,
      success: function (res) {
        if (res.success) {
          location.reload();
        }
      },
    });
  });

  $(".copy").click(function () {
    $(this).prepend('<span class="copied_text">Copied</span>');

    var group_id = $(this).attr("data-id");
    var url = window.location.host + "/share-group/" + group_id;

    var temp = $("<input>");
    $("body").append(temp);
    temp.val(url).select();
    document.execCommand("copy");
    temp.remove();

    setTimeout(() => {
      $(".copied_text").remove();
    }, 2000);
  });

  $(".join-now").click(function () {
    $(this).text("Wait...");
    $(this).attr("disabled", "disabled");

    var group_id = $(this).attr("data-id");

    $.ajax({
      url: "/join-group",
      type: "POST",
      data: { group_id: group_id },
      success: function (res) {
        if (res.success) {
          location.reload();
          
        } else {
          $(this).text("Join Now");
          $(this).removeAttr("disabled");
        }
      },
    });
  });



  $(".group-list").click(function(){
    $(".group-start-head").hide()
    $(".group-chat-section").show()

  })
})(jQuery);
