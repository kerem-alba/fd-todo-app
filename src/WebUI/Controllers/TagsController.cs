using MediatR;
using Microsoft.AspNetCore.Mvc;
using Todo_App.Application.Tags.Commands.CreateTag;
using Todo_App.Application.Tags.Commands.DeleteTag;
using Todo_App.Application.Tags.Queries.GetTags;
using Todo_App.WebUI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TagsController : ApiControllerBase
{
    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateTagCommand command)
    {
        return await Mediator.Send(command);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await Mediator.Send(new DeleteTagCommand(id));
        return NoContent();
    }

    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetAllTags()
    {
        return await Mediator.Send(new GetTagsQuery());
    }
}
