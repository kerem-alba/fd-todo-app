using AutoMapper;
using Todo_App.Application.Common.Mappings;
using Todo_App.Domain.Entities;
using Todo_App.Domain.ValueObjects;

namespace Todo_App.Application.Tags.Queries.GetTags;

public class TagDto : IMapFrom<Tag>
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6666FF";


    public void Mapping(Profile profile)
    {
        profile.CreateMap<Tag, TagDto>()
            .ForMember(dest => dest.Color, opt => opt.MapFrom(src => src.Color.Code));
    }
}
