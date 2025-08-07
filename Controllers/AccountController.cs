using System;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using LoginRegistrationMVC.Data;
using LoginRegistrationMVC.Models;

namespace LoginRegistrationMVC.Controllers
{
    public class AccountController : Controller
    {
        private readonly UserRepository _userRepository = new UserRepository();

        [AllowAnonymous]
        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Login(LoginViewModel model)
        {
            if (ModelState.IsValid)
            {
                var user = _userRepository.GetUserByEmail(model.Email);

                if (user != null && user.HashedPassword == model.Password)
                {
                    System.Web.Security.FormsAuthentication.SetAuthCookie(model.Email, false);
                    return Json(new { Success = true, Message = "Login successful" });
                }
                ModelState.AddModelError("", "Invalid email or password.");
            }
            return Json(new { Success = false, Message = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))) });
        }

        [AllowAnonymous]
        public ActionResult Register()
        {
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        public ActionResult Register(RegisterViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var existingUser = _userRepository.GetUserByEmail(model.Email);
                    if (existingUser != null)
                    {
                        ModelState.AddModelError("email", "Email is already registered.");
                    }
                    else if (model.Password != model.ConfirmPassword)
                    {
                        ModelState.AddModelError("confirmPassword", "Passwords do not match.");
                    }
                    else
                    {
                        string imagePath = null;
                        if (model.Image != null && model.Image.ContentLength > 0)
                        {
                            string uploadsFolder = Server.MapPath("~/Uploads");
                            if (!Directory.Exists(uploadsFolder))
                            {
                                Directory.CreateDirectory(uploadsFolder);
                            }
                            string fileName = DateTime.Now.ToString("yyyyMMddHHmmssfff") + "_" + Path.GetFileName(model.Image.FileName);
                            string path = Path.Combine(uploadsFolder, fileName);

                            model.Image.SaveAs(path);
                            imagePath = "/Uploads/" + fileName;
                        }

                        if (ModelState.IsValid) 
                        {
                            var user = new User
                            {
                                Email = model.Email,
                                HashedPassword = model.Password,
                                Name = model.Name,
                                Gender = model.Gender,
                                DateOfBirth = model.DateOfBirth,
                                ImagePath = imagePath,
                                Role = "User"
                            };
                            _userRepository.AddUser(user);
                            System.Web.Security.FormsAuthentication.SetAuthCookie(model.Email, false);
                            return Json(new { Success = true, Message = "Registration successful" });
                        }
                    }
                }
                return Json(new { Success = false, Message = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage))) });
            }
            catch (Exception ex)
            {
                return Json(new { Success = false, Message = "An error occurred during registration: " + ex.Message });
            }
        }

        [Authorize]
        public ActionResult Dashboard()
        {
            var user = _userRepository.GetUserByEmail(User.Identity.Name);
            ViewBag.User = user;
            return View(user);
        }

        public ActionResult Logout()
        {
            System.Web.Security.FormsAuthentication.SignOut();
            return RedirectToAction("Login");
        }



        [Authorize]
        public ActionResult Chat()
        {
            return View();
        }
    }
}