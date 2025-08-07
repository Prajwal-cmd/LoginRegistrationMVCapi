using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using LoginRegistrationMVC.Models;

namespace LoginRegistrationMVC.Data
{
    public class UserRepository
    {
        private readonly string _connectionString;

        public UserRepository()
        {
            _connectionString = ConfigurationManager.ConnectionStrings["DefaultConnection"].ConnectionString;
        }

        public void AddUser(User user)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var command = new SqlCommand("sp_AddNewUser", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };
                command.Parameters.AddWithValue("@Email", (object)user.Email ?? DBNull.Value);
                command.Parameters.AddWithValue("@HashedPassword", (object)user.HashedPassword ?? DBNull.Value);
                command.Parameters.AddWithValue("@Name", (object)user.Name ?? DBNull.Value);
                command.Parameters.AddWithValue("@Gender", (object)user.Gender ?? DBNull.Value);
                command.Parameters.AddWithValue("@DateOfBirth", (object)user.DateOfBirth ?? DBNull.Value);
                command.Parameters.AddWithValue("@ImagePath", (object)user.ImagePath ?? DBNull.Value);
                command.Parameters.AddWithValue("@Role", (object)user.Role ?? "User");
                connection.Open();
                foreach (SqlParameter param in command.Parameters)
                {
                    Console.WriteLine($"Parameter: {param.ParameterName}, Value: {param.Value}");
                }
                command.ExecuteNonQuery();
            }
        }

        public User GetUserByEmail(string email)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var command = new SqlCommand("sp_GetUserByEmail", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };
                command.Parameters.AddWithValue("@Email", (object)email ?? DBNull.Value);
                connection.Open();
                using (var reader = command.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        return new User
                        {
                            Id = reader.GetInt32(0),
                            Email = reader.GetString(1),
                            HashedPassword = reader.GetString(2),
                            Name = reader.IsDBNull(3) ? null : reader.GetString(3),
                            Gender = reader.IsDBNull(4) ? null : reader.GetString(4),
                            DateOfBirth = reader.IsDBNull(5) ? default : reader.GetDateTime(5),
                            ImagePath = reader.IsDBNull(6) ? null : reader.GetString(6),
                            Role = reader.IsDBNull(7) ? "User" : reader.GetString(7)
                        };
                    }
                    return null;
                }



            }
        }


        public List<User> GetAllUsers(string searchTerm = null, string filter = null)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var command = new SqlCommand("sp_GetAllUsers", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };
                command.Parameters.AddWithValue("@SearchTerm", (object)searchTerm ?? DBNull.Value);
                command.Parameters.AddWithValue("@Filter", (object)filter ?? DBNull.Value);
                connection.Open();
                var users = new List<User>();
                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        users.Add(new User
                        {
                            Id = reader.GetInt32(0),
                            Email = reader.GetString(1),
                            HashedPassword = reader.GetString(2),
                            Name = reader.IsDBNull(3) ? null : reader.GetString(3),
                            Gender = reader.IsDBNull(4) ? null : reader.GetString(4),
                            DateOfBirth = reader.IsDBNull(5) ? default : reader.GetDateTime(5),
                            ImagePath = reader.IsDBNull(6) ? null : reader.GetString(6),
                            Role = reader.IsDBNull(7) ? "User" : reader.GetString(7)
                        });
                    }
                }
                return users;
            }
        }
    }


}