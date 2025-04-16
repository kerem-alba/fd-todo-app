using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Todo_App.Application.Common.Interfaces;
using Todo_App.Application.Tags.Queries.GetTags;

namespace Todo_App.Application.TodoItems.Queries.GetTagsOfTodoItem;

public record GetTagsOfTodoItemQuery(int TodoItemId) : IRequest<List<TagDto>>;

public class GetTagsOfTodoItemQueryHandler : IRequestHandler<GetTagsOfTodoItemQuery, List<TagDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetTagsOfTodoItemQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<TagDto>> Handle(GetTagsOfTodoItemQuery request, CancellationToken cancellationToken)
    {
        return await _context.TodoItemTags
            .Where(x => x.TodoItemId == request.TodoItemId)
            .Select(x => x.Tag)
            .ProjectTo<TagDto>(_mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
