using System;

namespace LoginRegistrationMVC.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string HashedPassword { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string ImagePath { get; set; }
        public string Role { get; set; }
    }
}